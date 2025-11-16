-- XP Overhaul: construction jobs, builders, and progress extensions

BEGIN;

CREATE TABLE IF NOT EXISTS construction_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  building_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('build', 'upgrade')),
  tier SMALLINT NOT NULL DEFAULT 1,
  quantity INTEGER NOT NULL DEFAULT 1,
  target_level INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completes_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  reward_claimed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'cancelled')),
  builder_slot SMALLINT NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  energy_cost BIGINT NOT NULL DEFAULT 0,
  quality_multiplier NUMERIC(5,3) NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_construction_jobs_user_status
  ON construction_jobs (user_id, status);

CREATE INDEX IF NOT EXISTS idx_construction_jobs_completion
  ON construction_jobs (completes_at)
  WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS builders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_index SMALLINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  speed_multiplier NUMERIC(5,3) NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_builders_user
  ON builders (user_id);

ALTER TABLE progress
  ADD COLUMN IF NOT EXISTS xp_overflow BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_cap_reached_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prestige_progress INTEGER NOT NULL DEFAULT 0;

COMMIT;
