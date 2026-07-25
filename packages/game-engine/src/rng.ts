export type Rng = () => number;

/** Mulberry32 — deterministic seeded RNG. */
export function createSeededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(
  weights: Record<string, number>,
  rng: Rng,
): string {
  let total = 0;
  for (const w of Object.values(weights)) total += w;
  let r = rng() * total;
  for (const [letter, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return letter;
  }
  return "e";
}
