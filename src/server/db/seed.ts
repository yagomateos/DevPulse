/**
 * Seeds PostgreSQL with the same deterministic dataset the in-memory
 * repository uses:  DATABASE_URL=postgres://… npm run db:seed
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createDataset } from '../data/dataset';
import * as schema from './schema';
import { seedDatabase } from './seed-data';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const client = postgres(url, { max: 1 });
  const data = createDataset();
  await seedDatabase(drizzle(client, { schema }), data);
  console.log(`Seeded ${data.projects.length} projects, ${data.pullRequests.length} PRs, ${data.deployments.length} deployments, ${data.incidents.length} incidents.`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
