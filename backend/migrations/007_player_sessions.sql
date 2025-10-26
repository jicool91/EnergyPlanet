-- 007_player_sessions.sql
-- Создаёт таблицу player_sessions для отслеживания серверного тика и связанной сессии авторизации.

BEGIN;

CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auth_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    last_tick_at TIMESTAMP WITH TIME ZONE,
    pending_passive_seconds INTEGER NOT NULL DEFAULT 0 CHECK (pending_passive_seconds >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_sessions_user_id ON player_sessions(user_id);

CREATE OR REPLACE FUNCTION touch_player_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_player_sessions_updated_at ON player_sessions;

CREATE TRIGGER trg_player_sessions_updated_at
    BEFORE UPDATE ON player_sessions
    FOR EACH ROW
    EXECUTE FUNCTION touch_player_sessions_updated_at();

COMMIT;
