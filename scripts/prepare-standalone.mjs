// Copies static assets next to the standalone server so `npm start`
// (node .next/standalone/server.js) serves CSS/JS exactly like the Docker image.
import { cpSync, existsSync } from 'node:fs';

if (!existsSync('.next/standalone')) {
  console.warn('[prepare-standalone] .next/standalone not found — skipping');
  process.exit(0);
}
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
if (existsSync('public')) cpSync('public', '.next/standalone/public', { recursive: true });
console.log('[prepare-standalone] static assets copied');
