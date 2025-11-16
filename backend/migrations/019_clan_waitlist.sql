-- Migration: 019_clan_waitlist
-- Description: Store clan waitlist submissions
-- Author: Energy Planet Team
-- Date: 2025-11-16

CREATE TABLE clan_waitlist_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    telegram_id BIGINT,
    username TEXT,
    handle TEXT NOT NULL,
    handle_lower TEXT NOT NULL,
    interest TEXT NOT NULL,
    note TEXT,
    source TEXT,
    ip_hash CHAR(64),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(handle_lower)
);

CREATE INDEX idx_clan_waitlist_created_at ON clan_waitlist_requests(created_at DESC);
CREATE INDEX idx_clan_waitlist_interest ON clan_waitlist_requests(interest);
CREATE INDEX idx_clan_waitlist_ip_hash ON clan_waitlist_requests(ip_hash);

CREATE TRIGGER update_clan_waitlist_updated_at
    BEFORE UPDATE ON clan_waitlist_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE clan_waitlist_requests IS 'User submissions for upcoming clan features.';
COMMENT ON COLUMN clan_waitlist_requests.handle IS 'Telegram username or contact handle supplied by user';
COMMENT ON COLUMN clan_waitlist_requests.interest IS 'Primary interest segment (raids, trading, wars, etc.)';
