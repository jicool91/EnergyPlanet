-- Migration: 014_referral_revenue
-- Adds tables to track referral revenue share payouts

BEGIN;

CREATE TABLE referral_revenue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_relation_id UUID NOT NULL REFERENCES referral_relations(id) ON DELETE CASCADE,
    purchase_id VARCHAR(128) NOT NULL,
    purchase_amount BIGINT NOT NULL,
    share_amount BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    referred_username VARCHAR(64),
    referred_first_name VARCHAR(128),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_revenue_events_referrer ON referral_revenue_events(referrer_id);
CREATE INDEX idx_referral_revenue_events_referred ON referral_revenue_events(referred_id);
CREATE INDEX idx_referral_revenue_events_granted_at ON referral_revenue_events(granted_at);

CREATE TABLE referral_revenue_totals (
    referral_relation_id UUID PRIMARY KEY REFERENCES referral_relations(id) ON DELETE CASCADE,
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_share_amount BIGINT NOT NULL DEFAULT 0,
    total_purchase_amount BIGINT NOT NULL DEFAULT 0,
    last_purchase_id VARCHAR(128),
    last_share_amount BIGINT,
    last_purchase_amount BIGINT,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_revenue_totals_referrer ON referral_revenue_totals(referrer_id);

COMMIT;
