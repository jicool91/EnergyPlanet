-- 012_auth_session_hardening.sql
-- Adds metadata to sessions for secure refresh rotation and creates audit log

BEGIN;

ALTER TABLE sessions
    ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN last_ip INET,
    ADD COLUMN last_user_agent TEXT,
    ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN family_id UUID DEFAULT uuid_generate_v4();

UPDATE sessions
SET family_id = id
WHERE family_id IS NULL;

ALTER TABLE sessions
    ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE sessions
    ALTER COLUMN family_id SET DEFAULT uuid_generate_v4();

ALTER TABLE sessions
    ADD CONSTRAINT sessions_family_version_unique UNIQUE (family_id, version);

CREATE INDEX idx_sessions_family_id ON sessions(family_id);
CREATE INDEX idx_sessions_revoked_at ON sessions(revoked_at) WHERE revoked_at IS NOT NULL;

CREATE TABLE session_refresh_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID,
    hashed_token VARCHAR(500),
    reason TEXT NOT NULL,
    ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_refresh_audit_session_id ON session_refresh_audit(session_id);
CREATE INDEX idx_session_refresh_audit_family_id ON session_refresh_audit(family_id);
CREATE INDEX idx_session_refresh_audit_created_at ON session_refresh_audit(created_at);

COMMIT;
