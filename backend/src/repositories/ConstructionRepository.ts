import { PoolClient } from 'pg';
import { runQuery } from './base';

export type ConstructionJobStatus = 'queued' | 'running' | 'completed' | 'cancelled';

export interface ConstructionJobRecord {
  id: string;
  userId: string;
  buildingId: string;
  action: 'build' | 'upgrade';
  tier: number;
  quantity: number;
  targetLevel: number;
  durationSeconds: number;
  startedAt: Date;
  completesAt: Date;
  completedAt: Date | null;
  rewardClaimedAt: Date | null;
  status: ConstructionJobStatus;
  builderSlot: number;
  xpReward: number;
  energyCost: number;
  qualityMultiplier: number;
  metadata: Record<string, unknown>;
}

interface ConstructionJobRow {
  id: string;
  user_id: string;
  building_id: string;
  action: 'build' | 'upgrade';
  tier: number;
  quantity: number;
  target_level: number;
  duration_seconds: number;
  started_at: string;
  completes_at: string;
  completed_at: string | null;
  reward_claimed_at: string | null;
  status: ConstructionJobStatus;
  builder_slot: number;
  xp_reward: number;
  energy_cost: string;
  quality_multiplier: string;
  metadata: Record<string, unknown>;
}

function mapJob(row: ConstructionJobRow): ConstructionJobRecord {
  return {
    id: row.id,
    userId: row.user_id,
    buildingId: row.building_id,
    action: row.action,
    tier: row.tier,
    quantity: row.quantity,
    targetLevel: row.target_level,
    durationSeconds: row.duration_seconds,
    startedAt: new Date(row.started_at),
    completesAt: new Date(row.completes_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    rewardClaimedAt: row.reward_claimed_at ? new Date(row.reward_claimed_at) : null,
    status: row.status,
    builderSlot: row.builder_slot,
    xpReward: row.xp_reward,
    energyCost: Number(row.energy_cost),
    qualityMultiplier: Number(row.quality_multiplier),
    metadata: row.metadata ?? {},
  };
}

export interface CreateConstructionJobInput {
  userId: string;
  buildingId: string;
  action: 'build' | 'upgrade';
  tier: number;
  quantity: number;
  targetLevel: number;
  durationSeconds: number;
  completesAt: Date;
  builderSlot: number;
  xpReward: number;
  energyCost: number;
  qualityMultiplier?: number;
  metadata?: Record<string, unknown>;
  status?: ConstructionJobStatus;
}

export async function createConstructionJob(
  input: CreateConstructionJobInput,
  client?: PoolClient
): Promise<ConstructionJobRecord> {
  const result = await runQuery<ConstructionJobRow>(
    `INSERT INTO construction_jobs
      (user_id, building_id, action, tier, quantity, target_level, duration_seconds,
       completes_at, builder_slot, xp_reward, energy_cost, quality_multiplier, metadata, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      input.userId,
      input.buildingId,
      input.action,
      input.tier,
      input.quantity,
      input.targetLevel,
      input.durationSeconds,
      input.completesAt,
      input.builderSlot,
      input.xpReward,
      input.energyCost,
      input.qualityMultiplier ?? 1,
      input.metadata ?? {},
      input.status ?? 'queued',
    ],
    client
  );
  return mapJob(result.rows[0]);
}

export async function listActiveJobs(
  userId: string,
  client?: PoolClient
): Promise<ConstructionJobRecord[]> {
  const result = await runQuery<ConstructionJobRow>(
    `SELECT *
     FROM construction_jobs
     WHERE user_id = $1 AND status IN ('queued', 'running')
     ORDER BY completes_at ASC`,
    [userId],
    client
  );
  return result.rows.map(mapJob);
}

export async function updateJobStatus(
  jobId: string,
  status: ConstructionJobStatus,
  client?: PoolClient
): Promise<ConstructionJobRecord | null> {
  const result = await runQuery<ConstructionJobRow>(
    `UPDATE construction_jobs
     SET status = $2,
         completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
     WHERE id = $1
     RETURNING *`,
    [jobId, status],
    client
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapJob(result.rows[0]);
}

export async function markJobClaimed(jobId: string, client?: PoolClient): Promise<void> {
  await runQuery(
    `UPDATE construction_jobs
     SET reward_claimed_at = NOW()
     WHERE id = $1`,
    [jobId],
    client
  );
}

export async function findJobById(
  jobId: string,
  client?: PoolClient
): Promise<ConstructionJobRecord | null> {
  const result = await runQuery<ConstructionJobRow>(
    `SELECT * FROM construction_jobs WHERE id = $1`,
    [jobId],
    client
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapJob(result.rows[0]);
}

export async function startConstructionJob(
  jobId: string,
  completesAt: Date,
  builderSlot: number,
  client?: PoolClient
): Promise<ConstructionJobRecord | null> {
  const result = await runQuery<ConstructionJobRow>(
    `UPDATE construction_jobs
     SET status = 'running',
         started_at = NOW(),
         completes_at = $2,
         builder_slot = $3
     WHERE id = $1
     RETURNING *`,
    [jobId, completesAt, builderSlot],
    client
  );
  if (result.rowCount === 0) {
    return null;
  }
  return mapJob(result.rows[0]);
}
