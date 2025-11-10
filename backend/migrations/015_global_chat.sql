-- Migration: 015_global_chat
-- Description: Introduce global chat message log
-- Author: Energy Planet Team
-- Date: 2025-11-09

CREATE TABLE IF NOT EXISTS global_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
    client_message_id UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_chat_created_at ON global_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_chat_user_id ON global_chat_messages(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_chat_client_message_id
  ON global_chat_messages(client_message_id)
  WHERE client_message_id IS NOT NULL;

COMMENT ON TABLE global_chat_messages IS 'Global lounge chat history (REST-based)';
COMMENT ON COLUMN global_chat_messages.client_message_id IS 'Client-supplied idempotency token (UUID)';
