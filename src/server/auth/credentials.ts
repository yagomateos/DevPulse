import 'server-only';

/**
 * Demo credential store (in memory). Every seeded member starts with the demo
 * password; changing it in Settings → Security really changes what login
 * accepts until the server restarts. A real deployment would delegate to an
 * identity provider.
 */
const DEMO_PASSWORD = 'demo123';
const store = globalThis as unknown as { __aiwPasswords?: Map<string, string> };
const passwords = () => (store.__aiwPasswords ??= new Map());

export function verifyPassword(userId: string, password: string) {
  return (passwords().get(userId) ?? DEMO_PASSWORD) === password;
}

export function setPassword(userId: string, password: string) {
  passwords().set(userId, password);
}

/** Test helper: back to the demo password for everyone. */
export function resetPasswords() {
  passwords().clear();
}
