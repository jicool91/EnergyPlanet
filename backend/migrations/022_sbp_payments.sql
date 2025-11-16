-- 022_sbp_payments.sql
-- Adds provider-specific fields for purchases and introduces purchase_events log

BEGIN;

ALTER TABLE purchases
    ADD COLUMN provider VARCHAR(32) NOT NULL DEFAULT 'mock',
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'STARS',
    ADD COLUMN amount_minor BIGINT DEFAULT 0,
    ADD COLUMN provider_order_id VARCHAR(128),
    ADD COLUMN payment_url TEXT,
    ADD COLUMN sbp_qr_id VARCHAR(128),
    ADD COLUMN sbp_payload TEXT,
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN status_reason VARCHAR(255),
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'succeeded';

COMMENT ON COLUMN purchases.provider IS 'Payment provider identifier (sbp, telegram, mock)';
COMMENT ON COLUMN purchases.currency IS 'ISO currency for amount_minor (e.g., RUB, USD, STARS)';
COMMENT ON COLUMN purchases.amount_minor IS 'Payment amount in minor units (kopeks, cents, stars)';
COMMENT ON COLUMN purchases.provider_order_id IS 'Identifier assigned by payment provider';
COMMENT ON COLUMN purchases.payment_url IS 'Deep-link / pay URL returned by provider';
COMMENT ON COLUMN purchases.sbp_qr_id IS 'Provider QR identifier (for SBP)';
COMMENT ON COLUMN purchases.sbp_payload IS 'Raw QR payload encoded as string';
COMMENT ON COLUMN purchases.expires_at IS 'When pending payment should expire';
COMMENT ON COLUMN purchases.status IS 'State machine for purchase lifecycle';
COMMENT ON COLUMN purchases.status_reason IS 'Optional description for failed/expired statuses';
COMMENT ON COLUMN purchases.metadata IS 'Provider-specific metadata blob';

CREATE INDEX IF NOT EXISTS idx_purchases_provider_status
    ON purchases(provider, status);

CREATE INDEX IF NOT EXISTS idx_purchases_provider_order
    ON purchases(provider_order_id)
    WHERE provider_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_expires_at
    ON purchases(expires_at)
    WHERE expires_at IS NOT NULL;

CREATE TABLE purchase_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    provider_status VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_events_purchase_id ON purchase_events(purchase_id);
CREATE INDEX idx_purchase_events_provider_status ON purchase_events(provider, provider_status);

COMMENT ON TABLE purchase_events IS 'Audit log for provider status callbacks';

COMMIT;
