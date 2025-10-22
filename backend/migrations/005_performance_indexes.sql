-- Migration: 005_performance_indexes
-- Description: Add performance indexes for leaderboard and event lookups
-- Author: Energy Planet Team
-- Date: 2025-10-22

-- Replace single-column energy index with composite index matching leaderboard ordering
DROP INDEX IF EXISTS idx_progress_total_energy;
CREATE INDEX idx_progress_energy_rank
  ON progress (total_energy_produced DESC, updated_at ASC);

-- Accelerate event history lookups by user and event type
CREATE INDEX IF NOT EXISTS idx_events_user_type_created_at
  ON events (user_id, event_type, created_at DESC);
