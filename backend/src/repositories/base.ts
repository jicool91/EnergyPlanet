import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { query } from '../db/connection';

type QueryParams = unknown[] | undefined;

export async function runQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: QueryParams,
  client?: PoolClient
): Promise<QueryResult<T>> {
  if (client) {
    return client.query<T>(text, params);
  }
  return query<T>(text, params);
}

export type RepositoryRecord = Record<string, unknown>;
