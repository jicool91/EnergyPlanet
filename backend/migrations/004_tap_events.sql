-- Migration: 004_tap_events
-- Description: Capture aggregated tap batches
-- Date: 2025-10-21

CREATE TABLE tap_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taps INTEGER NOT NULL CHECK (taps > 0),
    energy_delta BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tap_events_user_id ON tap_events(user_id);
CREATE INDEX idx_tap_events_created_at ON tap_events(created_at DESC);
