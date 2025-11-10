-- Migration: 016_global_chat_index_fix
-- Description: Replace partial client_message_id index with full unique index for ON CONFLICT support
-- Author: Energy Planet Team
-- Date: 2025-11-10

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_global_chat_client_message_id'
          AND indexdef ILIKE '%WHERE%client_message_id IS NOT NULL%'
    ) THEN
        EXECUTE 'DROP INDEX IF EXISTS idx_global_chat_client_message_id';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_chat_client_message_id
  ON global_chat_messages(client_message_id);
