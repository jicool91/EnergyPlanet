import { PoolClient } from 'pg';
import { runQuery } from './base';

type QuestStatus = 'active' | 'ready' | 'claimed';

export interface QuestProgressRecord {
  id: string;
  userId: string;
  questId: string;
  questType: string;
  baselineValue: number;
  progressValue: number;
  targetValue: number;
  rewardStars: number;
  rewardEnergy: number;
  rewardXp: number;
  status: QuestStatus;
  expiresAt: Date;
  metadata: Record<string, unknown>;
  lastProgressAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestProgressRow {
  id: string;
  user_id: string;
  quest_id: string;
  quest_type: string;
  baseline_value: string;
  progress_value: string;
  target_value: string;
  reward_stars: number;
  reward_energy: string;
  reward_xp: string;
  status: QuestStatus;
  expires_at: string;
  metadata: any;
  last_progress_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapQuestProgress(row: QuestProgressRow): QuestProgressRecord {
  return {
    id: row.id,
    userId: row.user_id,
    questId: row.quest_id,
    questType: row.quest_type,
    baselineValue: Number(row.baseline_value ?? '0'),
    progressValue: Number(row.progress_value ?? '0'),
    targetValue: Number(row.target_value ?? '0'),
    rewardStars: row.reward_stars ?? 0,
    rewardEnergy: Number(row.reward_energy ?? '0'),
    rewardXp: Number(row.reward_xp ?? '0'),
    status: row.status,
    expiresAt: new Date(row.expires_at),
    metadata: row.metadata ?? {},
    lastProgressAt: row.last_progress_at ? new Date(row.last_progress_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listQuestProgress(
  userId: string,
  client?: PoolClient
): Promise<QuestProgressRecord[]> {
  const result = await runQuery<QuestProgressRow>(
    `SELECT *
     FROM quest_progress
     WHERE user_id = $1
     ORDER BY quest_type, quest_id`,
    [userId],
    client
  );

  return result.rows.map(mapQuestProgress);
}

export async function getQuestProgress(
  userId: string,
  questId: string,
  client?: PoolClient
): Promise<QuestProgressRecord | null> {
  const result = await runQuery<QuestProgressRow>(
    `SELECT *
     FROM quest_progress
     WHERE user_id = $1 AND quest_id = $2`,
    [userId, questId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapQuestProgress(result.rows[0]);
}

interface UpsertQuestProgressInput {
  questId: string;
  questType: string;
  baselineValue: number;
  progressValue: number;
  targetValue: number;
  rewardStars: number;
  rewardEnergy: number;
  rewardXp: number;
  status: QuestStatus;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export async function upsertQuestProgress(
  userId: string,
  input: UpsertQuestProgressInput,
  client?: PoolClient
): Promise<QuestProgressRecord> {
  const result = await runQuery<QuestProgressRow>(
    `INSERT INTO quest_progress (
        user_id,
        quest_id,
        quest_type,
        baseline_value,
        progress_value,
        target_value,
        reward_stars,
        reward_energy,
        reward_xp,
        status,
        expires_at,
        metadata
     ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb
     )
     ON CONFLICT (user_id, quest_id)
     DO UPDATE SET
        quest_type = EXCLUDED.quest_type,
        baseline_value = EXCLUDED.baseline_value,
        progress_value = EXCLUDED.progress_value,
        target_value = EXCLUDED.target_value,
        reward_stars = EXCLUDED.reward_stars,
        reward_energy = EXCLUDED.reward_energy,
        reward_xp = EXCLUDED.reward_xp,
        status = EXCLUDED.status,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        last_progress_at = NOW()
     RETURNING *`,
    [
      userId,
      input.questId,
      input.questType,
      input.baselineValue,
      input.progressValue,
      input.targetValue,
      input.rewardStars,
      input.rewardEnergy,
      input.rewardXp,
      input.status,
      input.expiresAt.toISOString(),
      JSON.stringify(input.metadata ?? {}),
    ],
    client
  );

  return mapQuestProgress(result.rows[0]);
}

export async function updateQuestStatus(
  userId: string,
  questId: string,
  status: QuestStatus,
  client?: PoolClient
): Promise<QuestProgressRecord | null> {
  const result = await runQuery<QuestProgressRow>(
    `UPDATE quest_progress
     SET status = $3,
         last_progress_at = NOW()
     WHERE user_id = $1 AND quest_id = $2
     RETURNING *`,
    [userId, questId, status],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapQuestProgress(result.rows[0]);
}

export type { QuestStatus, UpsertQuestProgressInput };
