import 'server-only';

/**
 * Demo mode unlocks conveniences that a real deployment must not have:
 * choosing your own role at sign-in, switching roles, simulating session
 * expiry and toggling simulated network conditions per request.
 *
 * It is ON by default so the portfolio works out of the box; set
 * DEMO_MODE=false for the production security posture (role comes from the
 * member record, debug switches are ignored).
 */
export function isDemoMode() {
  return process.env.DEMO_MODE !== 'false';
}
