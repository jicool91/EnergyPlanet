-- Migration: 009_stars_balance
-- Description: Add stars_balance tracking to player progress
-- Author: Codex
-- Date: 2025-10-27

ALTER TABLE progress
    ADD COLUMN stars_balance BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_progress_stars_balance
    ON progress(stars_balance);
