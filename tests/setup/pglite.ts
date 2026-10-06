import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from '@/server/db/schema';

/** A real Postgres (PGlite, in-process WASM) with every generated migration applied in order, as in production. */
export async function createTestDb() {
  const client = new PGlite();
  const dir = join(process.cwd(), 'drizzle');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    for (const statement of readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint')) {
      if (statement.trim()) await client.exec(statement);
    }
  }
  return drizzle(client, { schema });
}
