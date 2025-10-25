-- Migration: 006_prestige_system
-- Description: Add prestige progression columns to progress table
-- Author: Energy Planet Team
-- Date: 2025-10-25

ALTER TABLE progress
    ADD COLUMN IF NOT EXISTS prestige_level INTEGER NOT NULL DEFAULT 0 CHECK (prestige_level >= 0),
    ADD COLUMN IF NOT EXISTS prestige_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (prestige_multiplier >= 1),
    ADD COLUMN IF NOT EXISTS prestige_energy_snapshot DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (prestige_energy_snapshot >= 0),
    ADD COLUMN IF NOT EXISTS prestige_last_reset TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_progress_prestige_level ON progress(prestige_level);
CREATE INDEX IF NOT EXISTS idx_progress_prestige_multiplier ON progress(prestige_multiplier);
