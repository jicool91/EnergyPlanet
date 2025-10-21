import { PoolClient, QueryResult } from 'pg';
import { runQuery } from './base';

interface CreateTapEventInput {
  userId: string;
  taps: number;
  energyDelta: number;
}

export async function createTapEvent(
  { userId, taps, energyDelta }: CreateTapEventInput,
  client?: PoolClient
): Promise<QueryResult> {
  return runQuery(
    `INSERT INTO tap_events (user_id, taps, energy_delta)
     VALUES ($1, $2, $3)`,
    [userId, taps, energyDelta],
    client
  );
}
