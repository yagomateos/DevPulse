/** Small deterministic PRNG (mulberry32) so demo data is stable across reloads and tests. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    float(min: number, max: number, digits = 2) {
      return Number((next() * (max - min) + min).toFixed(digits));
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error('pick() called with an empty list');
      return item;
    },
    chance(probability: number) {
      return next() < probability;
    },
    sha() {
      return Array.from({ length: 7 }, () => Math.floor(next() * 16).toString(16)).join('');
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
