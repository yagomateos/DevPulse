import 'server-only';
import type { Repository } from '../repositories';
import { hashPassword, verifyPasswordHash } from './password';

/**
 * Credential checks backed by the repository, so they survive restarts and
 * are shared by every serverless instance. Members who set a password (by
 * accepting an invitation or in Settings → Security) are checked against its
 * scrypt hash; seeded demo members without one keep the documented demo
 * password.
 */
const DEMO_PASSWORD = 'demo123';

export async function verifyPassword(repo: Repository, userId: string, password: string) {
  const hash = await repo.auth.passwordHash(userId);
  return hash ? verifyPasswordHash(password, hash) : password === DEMO_PASSWORD;
}

export async function setPassword(repo: Repository, userId: string, password: string) {
  await repo.auth.setPasswordHash(userId, await hashPassword(password));
}
