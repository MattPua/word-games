/** Single authoritative game config. Loosen thresholds here if gen flakes. */

/** Global floor — modes may raise via minWordLength. */
export const MIN_WORD_LENGTH = 3;

export const MIN_WORD_LENGTH_OPTIONS = [3, 4, 5] as const;
export type MinWordLength = (typeof MIN_WORD_LENGTH_OPTIONS)[number];

/** points = length - 2 (only for accepted words ≥ active min). */
export function scoreWord(length: number): number {
  if (length < MIN_WORD_LENGTH) return 0;
  return length - 2;
}

export const TARGET_RATIOS = {
  easy: 0.35,
  medium: 0.55,
  hard: 0.75,
} as const;

export type Difficulty = keyof typeof TARGET_RATIOS;

export const TIMED_DURATIONS = [30, 60, 90, 120] as const;
export type TimedDuration = (typeof TIMED_DURATIONS)[number];

export const GRID_SIZES = [4, 5, 6] as const;
export type GridSize = (typeof GRID_SIZES)[number];

export type WordCountThresholds = {
  ge3: number;
  ge4: number;
  ge5: number;
  ge6: number;
  total: number;
};

/** Min-word thresholds by grid size (for default min length 3). */
export const BOARD_THRESHOLDS: Record<GridSize, WordCountThresholds> = {
  4: { ge3: 40, ge4: 15, ge5: 4, ge6: 1, total: 50 },
  5: { ge3: 80, ge4: 35, ge5: 12, ge6: 4, total: 100 },
  6: { ge3: 140, ge4: 60, ge5: 25, ge6: 10, total: 180 },
};

export const HARD_TARGET_FLOOR = 15;
export const GEN_RETRY_CAP = 80;

/**
 * Targets from maxScore of words ≥ active min length.
 * Never exceeds maxScore (Hard floor clamps down when board is lean).
 */
export function computeTargets(maxScore: number): {
  easy: number;
  medium: number;
  hard: number;
} {
  const clamp = (n: number) => Math.min(maxScore, Math.max(0, n));
  return {
    easy: clamp(Math.ceil(maxScore * TARGET_RATIOS.easy)),
    medium: clamp(Math.ceil(maxScore * TARGET_RATIOS.medium)),
    hard: clamp(
      Math.max(HARD_TARGET_FLOOR, Math.ceil(maxScore * TARGET_RATIOS.hard)),
    ),
  };
}

/** Zero out length buckets below the active min word length. */
export function thresholdsForMinLength(
  base: WordCountThresholds,
  minWordLength: MinWordLength,
): WordCountThresholds {
  return {
    ge3: minWordLength <= 3 ? base.ge3 : 0,
    ge4: minWordLength <= 4 ? base.ge4 : 0,
    ge5: minWordLength <= 5 ? base.ge5 : 0,
    ge6: base.ge6,
    // Fewer short words allowed → leaner total expectation
    total: Math.max(
      1,
      Math.floor(base.total * (minWordLength === 3 ? 1 : minWordLength === 4 ? 0.55 : 0.3)),
    ),
  };
}

/** English letter weights biased toward common short words. */
export const LETTER_WEIGHTS: Record<string, number> = {
  a: 8.2,
  b: 1.5,
  c: 2.8,
  d: 4.3,
  e: 12.7,
  f: 2.2,
  g: 2.0,
  h: 6.1,
  i: 7.0,
  j: 0.15,
  k: 0.8,
  l: 4.0,
  m: 2.4,
  n: 6.7,
  o: 7.5,
  p: 1.9,
  q: 0.1,
  r: 6.0,
  s: 6.3,
  t: 9.1,
  u: 2.8,
  v: 1.0,
  w: 2.4,
  x: 0.15,
  y: 2.0,
  z: 0.07,
};
