-- Migration: 002_clans_schema
-- Description: Add clan system tables (Post-MVP Phase 2)
-- Author: Energy Planet Team
-- Date: 2024-02-15

-- =============================================================================
-- CLANS TABLE
-- =============================================================================
CREATE TABLE clans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    tag VARCHAR(10) NOT NULL UNIQUE, -- Clan tag (e.g., [ENGY])
    description TEXT,
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    member_count INTEGER DEFAULT 1 NOT NULL CHECK (member_count >= 0),
    max_members INTEGER DEFAULT 50 NOT NULL,
    total_clan_energy DOUBLE PRECISION DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL CHECK (level >= 1),
    is_public BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clans_name ON clans(name);
CREATE INDEX idx_clans_tag ON clans(tag);
CREATE INDEX idx_clans_leader_id ON clans(leader_id);
CREATE INDEX idx_clans_total_energy ON clans(total_clan_energy DESC);
CREATE INDEX idx_clans_is_public ON clans(is_public);

-- =============================================================================
-- CLAN_MEMBERS TABLE
-- =============================================================================
CREATE TABLE clan_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' NOT NULL, -- leader, officer, member
    energy_contributed DOUBLE PRECISION DEFAULT 0 NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- User can only be in one clan
);

CREATE INDEX idx_clan_members_clan_id ON clan_members(clan_id);
CREATE INDEX idx_clan_members_user_id ON clan_members(user_id);
CREATE INDEX idx_clan_members_role ON clan_members(role);
CREATE INDEX idx_clan_members_energy ON clan_members(energy_contributed DESC);

-- =============================================================================
-- CLAN_JOIN_REQUESTS TABLE
-- =============================================================================
CREATE TABLE clan_join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clan_id, user_id)
);

CREATE INDEX idx_clan_join_requests_clan_id ON clan_join_requests(clan_id);
CREATE INDEX idx_clan_join_requests_user_id ON clan_join_requests(user_id);
CREATE INDEX idx_clan_join_requests_status ON clan_join_requests(status);

-- =============================================================================
-- CLAN_CHAT TABLE (Simple message log)
-- =============================================================================
CREATE TABLE clan_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clan_chat_clan_id ON clan_chat(clan_id, created_at DESC);
CREATE INDEX idx_clan_chat_user_id ON clan_chat(user_id);

-- =============================================================================
-- CLAN_EVENTS TABLE (Challenges & Activities)
-- =============================================================================
CREATE TABLE clan_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- weekly_race, energy_challenge, building_spree
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    rewards JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clan_events_active ON clan_events(is_active, start_time, end_time);

-- =============================================================================
-- CLAN_EVENT_PARTICIPATION TABLE
-- =============================================================================
CREATE TABLE clan_event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES clan_events(id) ON DELETE CASCADE,
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    score DOUBLE PRECISION DEFAULT 0 NOT NULL,
    rank INTEGER,
    rewards_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, clan_id)
);

CREATE INDEX idx_clan_event_participation_event_id ON clan_event_participation(event_id);
CREATE INDEX idx_clan_event_participation_score ON clan_event_participation(event_id, score DESC);

-- =============================================================================
-- CLAN_PERKS TABLE (Bonuses based on clan level/members)
-- =============================================================================
CREATE TABLE clan_perks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    perk_type VARCHAR(50) NOT NULL, -- passive_bonus, tap_boost, building_discount
    perk_value DOUBLE PRECISION NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clan_perks_clan_id ON clan_perks(clan_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_clans_updated_at BEFORE UPDATE ON clans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_join_requests_updated_at BEFORE UPDATE ON clan_join_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_event_participation_updated_at BEFORE UPDATE ON clan_event_participation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update clan member count on insert/delete
CREATE OR REPLACE FUNCTION update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clans SET member_count = member_count + 1 WHERE id = NEW.clan_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clans SET member_count = member_count - 1 WHERE id = OLD.clan_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clan_member_count_insert
AFTER INSERT ON clan_members
FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

CREATE TRIGGER trigger_update_clan_member_count_delete
AFTER DELETE ON clan_members
FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Clan leaderboard
CREATE OR REPLACE VIEW leaderboard_clans AS
SELECT
    ROW_NUMBER() OVER (ORDER BY c.total_clan_energy DESC) AS rank,
    c.id AS clan_id,
    c.name,
    c.tag,
    c.member_count,
    c.total_clan_energy,
    c.level,
    u.username AS leader_username
FROM clans c
JOIN users u ON c.leader_id = u.id
ORDER BY c.total_clan_energy DESC;

-- Clan member roster with stats
CREATE OR REPLACE VIEW clan_roster AS
SELECT
    cm.clan_id,
    cm.user_id,
    u.username,
    cm.role,
    p.level AS player_level,
    cm.energy_contributed,
    cm.joined_at
FROM clan_members cm
JOIN users u ON cm.user_id = u.id
JOIN progress p ON cm.user_id = p.user_id
ORDER BY cm.clan_id, cm.energy_contributed DESC;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE clans IS 'Clan organizations for cooperative play';
COMMENT ON TABLE clan_members IS 'Clan membership and roles';
COMMENT ON TABLE clan_join_requests IS 'Pending join requests for clans';
COMMENT ON TABLE clan_chat IS 'Simple clan chat message log';
COMMENT ON TABLE clan_events IS 'Clan-wide events and challenges';
COMMENT ON TABLE clan_event_participation IS 'Clan participation in events';
COMMENT ON TABLE clan_perks IS 'Active perks for clans based on level/members';
