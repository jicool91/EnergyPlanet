-- 013_session_family_revocation.sql
-- Adds revocation metadata to session_refresh_audit and helpers for manual family revocation

BEGIN;

ALTER TABLE session_refresh_audit
    ADD COLUMN revocation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_session_refresh_audit_revocation_reason
    ON session_refresh_audit ((COALESCE(revocation_reason, '')));

COMMIT;
