import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface AchievementTier {
  id: string;
  tier: number;
  threshold: number;
  rewardMultiplier: number;
  title: string | null;
  rewardSummary: string | null;
}

export interface AchievementDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  metric: string;
  unit: string;
  rewardType: string;
  maxTier: number;
  tiers: AchievementTier[];
}

export interface UserAchievementProgress {
  userId: string;
  achievementId: string;
  progressValue: number;
  currentTier: number;
  highestUnlockedTier: number;
  lastProgressTs: Date;
  updatedAt: Date;
}

interface AchievementRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  metric: string;
  unit: string;
  reward_type: string;
  max_tier: number;
}

interface TierRow {
  id: string;
  achievement_id: string;
  tier: number;
  threshold: string;
  reward_multiplier: string;
  title: string | null;
  reward_summary: string | null;
}

interface UserAchievementRow {
  user_id: string;
  achievement_id: string;
  progress_value: string;
  current_tier: number;
  highest_unlocked_tier: number;
  last_progress_ts: string;
  updated_at: string;
}

function mapDefinition(row: AchievementRow): AchievementDefinition {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    icon: row.icon,
    metric: row.metric,
    unit: row.unit,
    rewardType: row.reward_type,
    maxTier: row.max_tier,
    tiers: [],
  };
}

function mapTier(row: TierRow): AchievementTier {
  return {
    id: row.id,
    tier: row.tier,
    threshold: Number(row.threshold),
    rewardMultiplier: Number(row.reward_multiplier),
    title: row.title,
    rewardSummary: row.reward_summary,
  };
}

function mapUserProgress(row: UserAchievementRow): UserAchievementProgress {
  return {
    userId: row.user_id,
    achievementId: row.achievement_id,
    progressValue: Number(row.progress_value),
    currentTier: row.current_tier,
    highestUnlockedTier: row.highest_unlocked_tier,
    lastProgressTs: new Date(row.last_progress_ts),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listAchievementDefinitions(
  client?: PoolClient
): Promise<AchievementDefinition[]> {
  const definitionsResult = await runQuery<AchievementRow>(
    `SELECT id, slug, name, description, category, icon, metric, unit, reward_type, max_tier
     FROM achievement_definitions
     ORDER BY category, name`,
    [],
    client
  );

  if (definitionsResult.rowCount === 0) {
    return [];
  }

  const tiersResult = await runQuery<TierRow>(
    `SELECT id, achievement_id, tier, threshold, reward_multiplier, title, reward_summary
     FROM achievement_tiers
     WHERE achievement_id = ANY($1::uuid[])
     ORDER BY achievement_id, tier`,
    [definitionsResult.rows.map(row => row.id)],
    client
  );

  const tierMap = new Map<string, AchievementTier[]>();
  for (const tier of tiersResult.rows) {
    const arr = tierMap.get(tier.achievement_id) ?? [];
    arr.push(mapTier(tier));
    tierMap.set(tier.achievement_id, arr);
  }

  return definitionsResult.rows.map(row => {
    const mapped = mapDefinition(row);
    mapped.tiers = tierMap.get(row.id) ?? [];
    return mapped;
  });
}

export async function getAchievementDefinitionBySlug(
  slug: string,
  client?: PoolClient
): Promise<AchievementDefinition | null> {
  const result = await runQuery<AchievementRow>(
    `SELECT id, slug, name, description, category, icon, metric, unit, reward_type, max_tier
     FROM achievement_definitions
     WHERE slug = $1`,
    [slug],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  const def = mapDefinition(result.rows[0]);

  const tiersResult = await runQuery<TierRow>(
    `SELECT id, achievement_id, tier, threshold, reward_multiplier, title, reward_summary
     FROM achievement_tiers
     WHERE achievement_id = $1
     ORDER BY tier`,
    [def.id],
    client
  );

  def.tiers = tiersResult.rows.map(mapTier);
  return def;
}

export async function listDefinitionsByMetric(
  metric: string,
  client?: PoolClient
): Promise<AchievementDefinition[]> {
  const result = await runQuery<AchievementRow>(
    `SELECT id, slug, name, description, category, icon, metric, unit, reward_type, max_tier
     FROM achievement_definitions
     WHERE metric = $1`,
    [metric],
    client
  );

  if (result.rowCount === 0) {
    return [];
  }

  const ids = result.rows.map(row => row.id);
  const tiersResult = await runQuery<TierRow>(
    `SELECT id, achievement_id, tier, threshold, reward_multiplier, title, reward_summary
     FROM achievement_tiers
     WHERE achievement_id = ANY($1::uuid[])
     ORDER BY achievement_id, tier`,
    [ids],
    client
  );

  const tierMap = new Map<string, AchievementTier[]>();
  for (const tier of tiersResult.rows) {
    const arr = tierMap.get(tier.achievement_id) ?? [];
    arr.push(mapTier(tier));
    tierMap.set(tier.achievement_id, arr);
  }

  return result.rows.map(row => {
    const mapped = mapDefinition(row);
    mapped.tiers = tierMap.get(row.id) ?? [];
    return mapped;
  });
}

export async function listUserAchievementProgress(
  userId: string,
  client?: PoolClient
): Promise<UserAchievementProgress[]> {
  const result = await runQuery<UserAchievementRow>(
    `SELECT user_id, achievement_id, progress_value, current_tier, highest_unlocked_tier, last_progress_ts, updated_at
     FROM user_achievements
     WHERE user_id = $1`,
    [userId],
    client
  );

  return result.rows.map(mapUserProgress);
}

export async function upsertUserAchievementProgress(
  userId: string,
  achievementId: string,
  progressValue: number,
  highestUnlockedTier: number,
  client?: PoolClient
): Promise<UserAchievementProgress> {
  const result = await runQuery<UserAchievementRow>(
    `INSERT INTO user_achievements (user_id, achievement_id, progress_value, highest_unlocked_tier, last_progress_ts)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, achievement_id)
     DO UPDATE
     SET progress_value = EXCLUDED.progress_value,
         highest_unlocked_tier = GREATEST(user_achievements.highest_unlocked_tier, EXCLUDED.highest_unlocked_tier),
         last_progress_ts = NOW()
     RETURNING user_id, achievement_id, progress_value, current_tier, highest_unlocked_tier, last_progress_ts, updated_at`,
    [userId, achievementId, progressValue, highestUnlockedTier],
    client
  );

  return mapUserProgress(result.rows[0]);
}

export async function updateUserAchievementTier(
  userId: string,
  achievementId: string,
  newTier: number,
  client?: PoolClient
): Promise<UserAchievementProgress> {
  const result = await runQuery<UserAchievementRow>(
    `UPDATE user_achievements
     SET current_tier = $3,
         last_progress_ts = NOW()
     WHERE user_id = $1
       AND achievement_id = $2
     RETURNING user_id, achievement_id, progress_value, current_tier, highest_unlocked_tier, last_progress_ts, updated_at`,
    [userId, achievementId, newTier],
    client
  );

  if (result.rowCount === 0) {
    throw new Error('user_achievement_not_found');
  }

  return mapUserProgress(result.rows[0]);
}

export async function ensureUserAchievementRow(
  userId: string,
  achievementId: string,
  client?: PoolClient
): Promise<UserAchievementProgress> {
  const result = await runQuery<UserAchievementRow>(
    `INSERT INTO user_achievements (user_id, achievement_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, achievement_id) DO UPDATE
     SET user_id = user_achievements.user_id
     RETURNING user_id, achievement_id, progress_value, current_tier, highest_unlocked_tier, last_progress_ts, updated_at`,
    [userId, achievementId],
    client
  );

  return mapUserProgress(result.rows[0]);
}
