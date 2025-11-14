-- Migration: 017_season_system
-- Description: Add season system tables for tracking player progress through seasons
-- Author: Energy Planet Team
-- Date: 2025-01-13

-- =============================================================================
-- SEASON_PROGRESS TABLE (Player progress in current season)
-- =============================================================================
CREATE TABLE season_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id VARCHAR(100) NOT NULL,

    -- XP progress in current season
    season_xp BIGINT DEFAULT 0 NOT NULL CHECK (season_xp >= 0),

    -- Energy produced in current season
    season_energy_produced DOUBLE PRECISION DEFAULT 0 NOT NULL CHECK (season_energy_produced >= 0),

    -- Leaderboard position (cached)
    leaderboard_rank INTEGER,

    -- Claimed rewards tracking
    claimed_leaderboard_reward BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, season_id)
);

CREATE INDEX idx_season_progress_user_id ON season_progress(user_id);
CREATE INDEX idx_season_progress_season_id ON season_progress(season_id);
CREATE INDEX idx_season_progress_season_energy ON season_progress(season_id, season_energy_produced DESC);
CREATE INDEX idx_season_progress_season_xp ON season_progress(season_id, season_xp DESC);
CREATE INDEX idx_season_progress_updated_at ON season_progress(updated_at);

-- =============================================================================
-- SEASON_REWARDS TABLE (Track all season rewards given to players)
-- =============================================================================
CREATE TABLE season_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id VARCHAR(100) NOT NULL,

    -- Reward info
    reward_type VARCHAR(50) NOT NULL, -- leaderboard, event, battle_pass
    reward_tier VARCHAR(50), -- gold, silver, bronze, top10, etc.
    final_rank INTEGER, -- Final leaderboard position

    -- Reward content (JSON)
    reward_payload JSONB NOT NULL DEFAULT '{}',

    -- Claim status
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, season_id, reward_type)
);

CREATE INDEX idx_season_rewards_user_id ON season_rewards(user_id);
CREATE INDEX idx_season_rewards_season_id ON season_rewards(season_id);
CREATE INDEX idx_season_rewards_claimed ON season_rewards(claimed);
CREATE INDEX idx_season_rewards_created_at ON season_rewards(created_at);

-- =============================================================================
-- SEASON_EVENTS TABLE (Track season event participation)
-- =============================================================================
CREATE TABLE season_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,

    -- Participation tracking
    participated BOOLEAN DEFAULT FALSE,
    reward_claimed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, season_id, event_id)
);

CREATE INDEX idx_season_events_user_id ON season_events(user_id);
CREATE INDEX idx_season_events_season_id ON season_events(season_id);
CREATE INDEX idx_season_events_event_id ON season_events(event_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE TRIGGER update_season_progress_updated_at BEFORE UPDATE ON season_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_events_updated_at BEFORE UPDATE ON season_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE season_progress IS 'Player progress tracking within each season (XP, energy, leaderboard rank)';
COMMENT ON TABLE season_rewards IS 'All season rewards granted to players (leaderboard, events, battle pass)';
COMMENT ON TABLE season_events IS 'Player participation in season events';

COMMENT ON COLUMN season_progress.season_xp IS 'XP earned during this season only (resets each season)';
COMMENT ON COLUMN season_progress.season_energy_produced IS 'Total energy produced during this season (for leaderboard)';
COMMENT ON COLUMN season_progress.leaderboard_rank IS 'Cached leaderboard position (updated periodically)';

COMMENT ON COLUMN season_rewards.reward_type IS 'Type of reward: leaderboard (top placement), event (season event), battle_pass (premium tier)';
COMMENT ON COLUMN season_rewards.reward_tier IS 'Tier of reward: gold/silver/bronze (top 3), top10, top50, top100';
COMMENT ON COLUMN season_rewards.reward_payload IS 'JSON containing reward details: {cosmetics: [], energy: 0, stars: 0}';
