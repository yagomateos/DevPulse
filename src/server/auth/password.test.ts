import { describe, expect, it } from 'vitest';
import { createInviteToken, hashInviteToken, hashPassword, verifyPasswordHash } from './password';

describe('password hashing', () => {
  it('verifies the right password and rejects others', async () => {
    const hash = await hashPassword('Correct-horse-9');
    expect(hash).toMatch(/^scrypt\$16384\$[\w+/=]+\$[\w+/=]+$/);
    expect(await verifyPasswordHash('Correct-horse-9', hash)).toBe(true);
    expect(await verifyPasswordHash('correct-horse-9', hash)).toBe(false);
  });

  it('salts every hash and rejects malformed stored values', async () => {
    expect(await hashPassword('Same-password-1')).not.toBe(await hashPassword('Same-password-1'));
    expect(await verifyPasswordHash('x', 'bcrypt$whatever')).toBe(false);
    expect(await verifyPasswordHash('x', '')).toBe(false);
  });
});

describe('invitation tokens', () => {
  it('are 256-bit url-safe strings whose stored form is a stable SHA-256', () => {
    const { token, tokenHash } = createInviteToken();
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(tokenHash).toBe(hashInviteToken(token));
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(createInviteToken().token).not.toBe(token);
  });
});
