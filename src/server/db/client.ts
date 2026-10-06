import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalDb = globalThis as unknown as { __aiwDb?: ReturnType<typeof drizzle<typeof schema>> };

export function getDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is not set');
  globalDb.__aiwDb ??= drizzle(postgres(url, { max: 5 }), { schema });
  return globalDb.__aiwDb;
}

export type Database = ReturnType<typeof getDb>;
