-- Migration: 001_initial_schema
-- Description: Create core tables for Energy Planet MVP
-- Author: Energy Planet Team
-- Date: 2024-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =============================================================================
-- PROGRESS TABLE
-- =============================================================================
CREATE TABLE progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1 NOT NULL CHECK (level >= 1),
    xp BIGINT DEFAULT 0 NOT NULL CHECK (xp >= 0),
    energy DOUBLE PRECISION DEFAULT 0 NOT NULL CHECK (energy >= 0),
    total_energy_produced DOUBLE PRECISION DEFAULT 0 NOT NULL CHECK (total_energy_produced >= 0),
    tap_level INTEGER DEFAULT 0 NOT NULL CHECK (tap_level >= 0),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_logout TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_level ON progress(level);
CREATE INDEX idx_progress_total_energy ON progress(total_energy_produced DESC);
CREATE INDEX idx_progress_last_login ON progress(last_login);

-- =============================================================================
-- INVENTORY (USER BUILDINGS)
-- =============================================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    building_id VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0 NOT NULL CHECK (count >= 0),
    level INTEGER DEFAULT 0 NOT NULL CHECK (level >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, building_id)
);

CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_inventory_building_id ON inventory(building_id);

-- =============================================================================
-- PURCHASES TABLE (Idempotency & Transaction Log)
-- =============================================================================
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL UNIQUE, -- Client-generated for idempotency
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_type VARCHAR(50) NOT NULL, -- energy_pack, premium_boost, cosmetic, ad_reward
    item_id VARCHAR(100) NOT NULL,
    price_stars INTEGER, -- NULL for free items
    telegram_payment_id VARCHAR(255), -- Telegram Stars payment ID
    ad_token VARCHAR(500), -- Ad provider token
    status VARCHAR(50) DEFAULT 'completed' NOT NULL, -- completed, failed, refunded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_purchase_id ON purchases(purchase_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);
CREATE INDEX idx_purchases_type ON purchases(purchase_type);

-- =============================================================================
-- EVENTS TABLE (Anti-cheat & Analytics)
-- =============================================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- tap, tick, upgrade, purchase, login, logout
    event_data JSONB NOT NULL DEFAULT '{}',
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_suspicious ON events(is_suspicious) WHERE is_suspicious = TRUE;
CREATE INDEX idx_events_data ON events USING GIN (event_data);

-- =============================================================================
-- COSMETICS TABLE (Static Content, synced from files)
-- =============================================================================
CREATE TABLE cosmetics (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- avatar_frame, planet_skin, tap_effect, background
    rarity VARCHAR(50) NOT NULL, -- common, rare, epic, legendary
    unlock_type VARCHAR(50) NOT NULL, -- free, level, purchase, event
    unlock_requirement JSONB DEFAULT '{}',
    asset_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cosmetics_category ON cosmetics(category);
CREATE INDEX idx_cosmetics_rarity ON cosmetics(rarity);
CREATE INDEX idx_cosmetics_unlock_type ON cosmetics(unlock_type);

-- =============================================================================
-- USER_COSMETICS TABLE (Ownership)
-- =============================================================================
CREATE TABLE user_cosmetics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cosmetic_id VARCHAR(100) NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX idx_user_cosmetics_user_id ON user_cosmetics(user_id);
CREATE INDEX idx_user_cosmetics_cosmetic_id ON user_cosmetics(cosmetic_id);

-- =============================================================================
-- USER_PROFILE TABLE (Equipped Cosmetics & Public Data)
-- =============================================================================
CREATE TABLE user_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    equipped_avatar_frame VARCHAR(100) REFERENCES cosmetics(id) ON DELETE SET NULL,
    equipped_planet_skin VARCHAR(100) REFERENCES cosmetics(id) ON DELETE SET NULL,
    equipped_tap_effect VARCHAR(100) REFERENCES cosmetics(id) ON DELETE SET NULL,
    equipped_background VARCHAR(100) REFERENCES cosmetics(id) ON DELETE SET NULL,
    bio TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- BOOSTS TABLE (Active Boosts)
-- =============================================================================
CREATE TABLE boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boost_type VARCHAR(50) NOT NULL, -- ad_boost, premium_boost, daily_boost
    multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_boosts_user_id ON boosts(user_id);
CREATE INDEX idx_boosts_expires_at ON boosts(expires_at);

-- Note: Active boosts uniqueness handled at application level

-- =============================================================================
-- SESSIONS TABLE (Track active sessions)
-- =============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Auto-delete expired sessions (cleanup job)
-- DELETE FROM sessions WHERE expires_at < NOW();

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cosmetics_updated_at BEFORE UPDATE ON cosmetics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA (Default Cosmetics)
-- =============================================================================

-- Insert default cosmetics (these will be overwritten by content loader)
INSERT INTO cosmetics (id, name, description, category, rarity, unlock_type, unlock_requirement) VALUES
('default_frame', 'Default Frame', 'Basic avatar frame', 'avatar_frame', 'common', 'free', '{}'),
('default_skin', 'Earth Planet', 'Default planet skin', 'planet_skin', 'common', 'free', '{}'),
('default_effect', 'Basic Tap', 'Standard tap effect', 'tap_effect', 'common', 'free', '{}'),
('default_bg', 'Space Background', 'Classic space theme', 'background', 'common', 'free', '{}');

-- =============================================================================
-- VIEWS (for convenient queries)
-- =============================================================================

-- Leaderboard view (cached)
CREATE OR REPLACE VIEW leaderboard_global AS
SELECT
    ROW_NUMBER() OVER (ORDER BY p.total_energy_produced DESC) AS rank,
    u.id AS user_id,
    u.username,
    p.level,
    p.total_energy_produced,
    prof.equipped_avatar_frame
FROM users u
JOIN progress p ON u.id = p.user_id
LEFT JOIN user_profile prof ON u.id = prof.user_id
WHERE u.is_banned = FALSE
ORDER BY p.total_energy_produced DESC;

-- User stats view (for profile)
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id AS user_id,
    u.username,
    p.level,
    p.total_energy_produced,
    (SELECT COUNT(*) FROM inventory WHERE user_id = u.id) AS buildings_count,
    (SELECT COUNT(*) FROM user_cosmetics WHERE user_id = u.id) AS cosmetics_count,
    u.created_at
FROM users u
JOIN progress p ON u.id = p.user_id;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'Main user accounts from Telegram';
COMMENT ON TABLE progress IS 'Player progression data (level, energy, stats)';
COMMENT ON TABLE inventory IS 'User-owned buildings and their levels';
COMMENT ON TABLE purchases IS 'Transaction log for all purchases (idempotency key: purchase_id)';
COMMENT ON TABLE events IS 'Event stream for analytics and anti-cheat';
COMMENT ON TABLE cosmetics IS 'Catalog of all cosmetic items (synced from content files)';
COMMENT ON TABLE user_cosmetics IS 'User ownership of cosmetic items';
COMMENT ON TABLE user_profile IS 'User public profile and equipped cosmetics';
COMMENT ON TABLE boosts IS 'Active boost effects (ad, premium, daily)';
COMMENT ON TABLE sessions IS 'Active refresh tokens for authentication';

-- =============================================================================
-- GRANTS (adjust based on your DB user)
-- =============================================================================

-- Example: GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO energyplanet_app;
-- Example: GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO energyplanet_app;
