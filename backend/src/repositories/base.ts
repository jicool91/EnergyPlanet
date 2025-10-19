import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { query } from '../db/connection';

type QueryParams = any[] | undefined;

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

export interface RepositoryRecord {
  [key: string]: any;
}
