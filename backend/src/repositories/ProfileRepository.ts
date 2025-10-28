import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface UserProfileRecord {
  userId: string;
  equippedAvatarFrame: string | null;
  equippedPlanetSkin: string | null;
  equippedTapEffect: string | null;
  equippedBackground: string | null;
  bio: string | null;
  isPublic: boolean;
  updatedAt: Date;
}

interface ProfileRow {
  user_id: string;
  equipped_avatar_frame: string | null;
  equipped_planet_skin: string | null;
  equipped_tap_effect: string | null;
  equipped_background: string | null;
  bio: string | null;
  is_public: boolean;
  updated_at: string;
}

function mapProfile(row: ProfileRow): UserProfileRecord {
  return {
    userId: row.user_id,
    equippedAvatarFrame: row.equipped_avatar_frame,
    equippedPlanetSkin: row.equipped_planet_skin,
    equippedTapEffect: row.equipped_tap_effect,
    equippedBackground: row.equipped_background,
    bio: row.bio,
    isPublic: row.is_public,
    updatedAt: new Date(row.updated_at),
  };
}

export async function getProfile(
  userId: string,
  client?: PoolClient
): Promise<UserProfileRecord | null> {
  const result = await runQuery<ProfileRow>(
    `SELECT *
     FROM user_profile
     WHERE user_id = $1`,
    [userId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapProfile(result.rows[0]);
}

export async function ensureProfile(
  userId: string,
  client?: PoolClient
): Promise<UserProfileRecord> {
  const result = await runQuery<ProfileRow>(
    `INSERT INTO user_profile (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId],
    client
  );

  return mapProfile(result.rows[0]);
}

export interface UpdateEquipmentInput {
  avatarFrame?: string | null;
  planetSkin?: string | null;
  tapEffect?: string | null;
  background?: string | null;
}

export async function updateEquipment(
  userId: string,
  equipment: UpdateEquipmentInput,
  client?: PoolClient
): Promise<UserProfileRecord> {
  const fields: string[] = [];
  const values: Array<string | null> = [];

  if (equipment.avatarFrame !== undefined) {
    fields.push(`equipped_avatar_frame = $${fields.length + 1}`);
    values.push(equipment.avatarFrame);
  }

  if (equipment.planetSkin !== undefined) {
    fields.push(`equipped_planet_skin = $${fields.length + 1}`);
    values.push(equipment.planetSkin);
  }

  if (equipment.tapEffect !== undefined) {
    fields.push(`equipped_tap_effect = $${fields.length + 1}`);
    values.push(equipment.tapEffect);
  }

  if (equipment.background !== undefined) {
    fields.push(`equipped_background = $${fields.length + 1}`);
    values.push(equipment.background);
  }

  if (fields.length === 0) {
    return (await getProfile(userId, client)) ?? (await ensureProfile(userId, client));
  }

  values.push(userId);

  const result = await runQuery<ProfileRow>(
    `UPDATE user_profile
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE user_id = $${fields.length + 1}
     RETURNING *`,
    values,
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`Profile for user ${userId} not found`);
  }

  return mapProfile(result.rows[0]);
}
