-- Migration: 003_arena_schema
-- Description: Add arena/PvP system tables (Post-MVP Phase 3)
-- Author: Energy Planet Team
-- Date: 2024-03-15

-- =============================================================================
-- ARENA_STATS TABLE (Player Arena Profile)
-- =============================================================================
CREATE TABLE arena_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    elo_rating INTEGER DEFAULT 1000 NOT NULL,
    rank_tier VARCHAR(50) DEFAULT 'bronze' NOT NULL, -- bronze, silver, gold, platinum, diamond
    wins INTEGER DEFAULT 0 NOT NULL CHECK (wins >= 0),
    losses INTEGER DEFAULT 0 NOT NULL CHECK (losses >= 0),
    win_streak INTEGER DEFAULT 0 NOT NULL CHECK (win_streak >= 0),
    best_win_streak INTEGER DEFAULT 0 NOT NULL CHECK (best_win_streak >= 0),
    total_battles INTEGER DEFAULT 0 NOT NULL CHECK (total_battles >= 0),
    season_wins INTEGER DEFAULT 0 NOT NULL CHECK (season_wins >= 0),
    season_losses INTEGER DEFAULT 0 NOT NULL CHECK (season_losses >= 0),
    highest_rank_tier VARCHAR(50),
    last_battle_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_arena_stats_elo ON arena_stats(elo_rating DESC);
CREATE INDEX idx_arena_stats_rank_tier ON arena_stats(rank_tier);
CREATE INDEX idx_arena_stats_wins ON arena_stats(wins DESC);

-- =============================================================================
-- ARENA_BATTLES TABLE (Match History)
-- =============================================================================
CREATE TABLE arena_battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_type VARCHAR(50) DEFAULT 'ranked' NOT NULL, -- ranked, tournament, friendly
    player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player1_power DOUBLE PRECISION NOT NULL, -- Energy production rate at battle time
    player2_power DOUBLE PRECISION NOT NULL,
    player1_elo_before INTEGER,
    player2_elo_before INTEGER,
    player1_elo_after INTEGER,
    player2_elo_after INTEGER,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    battle_data JSONB DEFAULT '{}', -- Detailed battle log for replay
    duration_sec INTEGER, -- Simulated battle duration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_arena_battles_player1 ON arena_battles(player1_id, created_at DESC);
CREATE INDEX idx_arena_battles_player2 ON arena_battles(player2_id, created_at DESC);
CREATE INDEX idx_arena_battles_winner ON arena_battles(winner_id);
CREATE INDEX idx_arena_battles_created_at ON arena_battles(created_at DESC);

-- =============================================================================
-- ARENA_QUEUE TABLE (Matchmaking Queue)
-- =============================================================================
CREATE TABLE arena_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    elo_rating INTEGER NOT NULL,
    power_level DOUBLE PRECISION NOT NULL, -- Cached energy production
    queue_type VARCHAR(50) DEFAULT 'ranked' NOT NULL,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_arena_queue_elo ON arena_queue(elo_rating);
CREATE INDEX idx_arena_queue_queued_at ON arena_queue(queued_at);

-- Auto-remove stale queue entries (older than 5 minutes)
-- Cleanup job: DELETE FROM arena_queue WHERE queued_at < NOW() - INTERVAL '5 minutes';

-- =============================================================================
-- ARENA_SEASONS TABLE
-- =============================================================================
CREATE TABLE arena_seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    rewards JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_arena_seasons_active ON arena_seasons(is_active);
CREATE INDEX idx_arena_seasons_dates ON arena_seasons(start_time, end_time);

-- Only one active season at a time
CREATE UNIQUE INDEX idx_arena_seasons_single_active ON arena_seasons(is_active)
WHERE is_active = TRUE;

-- =============================================================================
-- ARENA_SEASON_REWARDS TABLE (Claimed Rewards)
-- =============================================================================
CREATE TABLE arena_season_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES arena_seasons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    final_rank INTEGER,
    final_elo INTEGER,
    final_tier VARCHAR(50),
    rewards JSONB DEFAULT '{}',
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season_id, user_id)
);

CREATE INDEX idx_arena_season_rewards_season ON arena_season_rewards(season_id);
CREATE INDEX idx_arena_season_rewards_user ON arena_season_rewards(user_id);
CREATE INDEX idx_arena_season_rewards_claimed ON arena_season_rewards(claimed);

-- =============================================================================
-- ARENA_TOURNAMENTS TABLE
-- =============================================================================
CREATE TABLE arena_tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bracket_size INTEGER DEFAULT 32 NOT NULL, -- 8, 16, 32, 64
    entry_fee_stars INTEGER DEFAULT 0,
    prize_pool JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'registration' NOT NULL, -- registration, in_progress, completed
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_arena_tournaments_status ON arena_tournaments(status);
CREATE INDEX idx_arena_tournaments_start ON arena_tournaments(start_time);

-- =============================================================================
-- ARENA_TOURNAMENT_PARTICIPANTS TABLE
-- =============================================================================
CREATE TABLE arena_tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES arena_tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seed INTEGER, -- Tournament seeding position
    current_round INTEGER DEFAULT 0,
    is_eliminated BOOLEAN DEFAULT FALSE,
    final_placement INTEGER,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

CREATE INDEX idx_tournament_participants_tournament ON arena_tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON arena_tournament_participants(user_id);

-- =============================================================================
-- ARENA_LOADOUTS TABLE (Defensive Setup)
-- =============================================================================
CREATE TABLE arena_loadouts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    loadout_data JSONB NOT NULL DEFAULT '{}', -- Custom defensive configuration
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_arena_stats_updated_at BEFORE UPDATE ON arena_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arena_loadouts_updated_at BEFORE UPDATE ON arena_loadouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update rank tier based on ELO
CREATE OR REPLACE FUNCTION update_arena_rank_tier()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.elo_rating >= 2000 THEN
        NEW.rank_tier := 'diamond';
    ELSIF NEW.elo_rating >= 1600 THEN
        NEW.rank_tier := 'platinum';
    ELSIF NEW.elo_rating >= 1300 THEN
        NEW.rank_tier := 'gold';
    ELSIF NEW.elo_rating >= 1100 THEN
        NEW.rank_tier := 'silver';
    ELSE
        NEW.rank_tier := 'bronze';
    END IF;

    -- Track highest rank
    IF NEW.highest_rank_tier IS NULL OR
       (NEW.rank_tier = 'diamond' AND NEW.highest_rank_tier != 'diamond') OR
       (NEW.rank_tier = 'platinum' AND NEW.highest_rank_tier IN ('gold', 'silver', 'bronze')) OR
       (NEW.rank_tier = 'gold' AND NEW.highest_rank_tier IN ('silver', 'bronze')) OR
       (NEW.rank_tier = 'silver' AND NEW.highest_rank_tier = 'bronze')
    THEN
        NEW.highest_rank_tier := NEW.rank_tier;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_arena_rank_tier
BEFORE INSERT OR UPDATE OF elo_rating ON arena_stats
FOR EACH ROW EXECUTE FUNCTION update_arena_rank_tier();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Arena leaderboard
CREATE OR REPLACE VIEW leaderboard_arena AS
SELECT
    ROW_NUMBER() OVER (ORDER BY ast.elo_rating DESC) AS rank,
    u.id AS user_id,
    u.username,
    ast.elo_rating,
    ast.rank_tier,
    ast.wins,
    ast.losses,
    ast.win_streak,
    prof.equipped_avatar_frame
FROM arena_stats ast
JOIN users u ON ast.user_id = u.id
LEFT JOIN user_profile prof ON u.id = prof.user_id
WHERE u.is_banned = FALSE
ORDER BY ast.elo_rating DESC;

-- Player arena profile
CREATE OR REPLACE VIEW arena_player_profile AS
SELECT
    ast.user_id,
    u.username,
    ast.elo_rating,
    ast.rank_tier,
    ast.wins,
    ast.losses,
    CASE
        WHEN ast.total_battles > 0 THEN ROUND((ast.wins::NUMERIC / ast.total_battles) * 100, 2)
        ELSE 0
    END AS win_rate,
    ast.win_streak,
    ast.best_win_streak,
    ast.season_wins,
    ast.season_losses,
    ast.highest_rank_tier,
    ast.last_battle_at
FROM arena_stats ast
JOIN users u ON ast.user_id = u.id;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE arena_stats IS 'Player arena statistics and ELO ratings';
COMMENT ON TABLE arena_battles IS 'Complete match history with ELO changes';
COMMENT ON TABLE arena_queue IS 'Active matchmaking queue';
COMMENT ON TABLE arena_seasons IS 'Arena competitive seasons';
COMMENT ON TABLE arena_season_rewards IS 'End-of-season rewards for players';
COMMENT ON TABLE arena_tournaments IS 'Bracket tournaments';
COMMENT ON TABLE arena_tournament_participants IS 'Tournament registrations';
COMMENT ON TABLE arena_loadouts IS 'Customizable defensive configurations';
