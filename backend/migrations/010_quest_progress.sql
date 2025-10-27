-- Migration: 010_quest_progress
-- Description: Quest progress tracking tables
-- Author: Codex
-- Date: 2025-10-27

CREATE TABLE quest_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id VARCHAR(100) NOT NULL,
    quest_type VARCHAR(20) NOT NULL,
    baseline_value BIGINT NOT NULL DEFAULT 0,
    progress_value BIGINT NOT NULL DEFAULT 0,
    target_value BIGINT NOT NULL DEFAULT 0,
    reward_stars INTEGER NOT NULL DEFAULT 0,
    reward_energy BIGINT NOT NULL DEFAULT 0,
    reward_xp BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_progress_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, quest_id)
);

CREATE INDEX idx_quest_progress_user_id ON quest_progress(user_id);
CREATE INDEX idx_quest_progress_status ON quest_progress(status);
CREATE INDEX idx_quest_progress_expires_at ON quest_progress(expires_at);

CREATE TRIGGER update_quest_progress_updated_at BEFORE UPDATE ON quest_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
