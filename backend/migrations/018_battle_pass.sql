-- Migration: 018_battle_pass
-- Description: Track premium season pass purchases per player
-- Author: Energy Planet Team
-- Date: 2025-11-16

CREATE TABLE season_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id VARCHAR(100) NOT NULL,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchase_price_stars INTEGER,
    purchase_source VARCHAR(100),
    purchase_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, season_id)
);

CREATE INDEX idx_season_passes_user_id ON season_passes(user_id);
CREATE INDEX idx_season_passes_season_id ON season_passes(season_id);

CREATE TRIGGER update_season_passes_updated_at
    BEFORE UPDATE ON season_passes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE season_passes IS 'Premium season pass purchases per user';
COMMENT ON COLUMN season_passes.is_premium IS 'Indicates whether the premium battle pass is unlocked';
