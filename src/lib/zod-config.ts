import * as z from 'zod';

/**
 * Zod 4 probes `new Function()` to decide whether to JIT-compile validators.
 * Under our Content-Security-Policy (no 'unsafe-eval') that probe is blocked
 * and reported as a CSP issue, so validators run in interpreted mode instead.
 */
z.config({ jitless: true });
