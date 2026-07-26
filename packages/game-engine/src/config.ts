/** Single authoritative game config. Loosen thresholds here if gen flakes. */

import type { GridTopology } from "./topology";

/** Global floor — modes may raise via minWordLength. */
export const MIN_WORD_LENGTH = 3;

export const MIN_WORD_LENGTH_OPTIONS = [3, 4, 5] as const;
export type MinWordLength = (typeof MIN_WORD_LENGTH_OPTIONS)[number];

/** points = length - 2 (only for accepted words ≥ active min). */
export function scoreWord(length: number): number {
  if (length < MIN_WORD_LENGTH) return 0;
  return length - 2;
}

/**
 * Goal targets as a fraction of board `maxScore` (points, not word count),
 * then **capped** so crumb-dense boards don’t demand triple-digit clears.
 *
 * Challenge ladder ≈ short-first word-coverage percentiles (Easy p50 / Med ~p58 /
 * Hard p80): 3-letter words are 1pt, so pts% ≪ word% under casual short-first
 * play. Monte Carlo over gen boards (~40× 4×4/5×5 square + 5×5 hex): clearing
 * 50/75/80% of words short-first yields ~0.31/0.58/0.65 of maxScore. We ship
 * ratios **0.30 / 0.40 / 0.65**, then clamp with `TARGET_CAPS` — dense 5×5/6×6
 * boards can have maxScore 200–300+ from short crumbs; without a cap, Med still
 * shows ~100+ “pts left” even when only a fraction of words is needed. Caps keep
 * Easy < Med < Hard. Scoring stays `length − 2`.
 */
export const TARGET_RATIOS = {
  easy: 0.3,
  medium: 0.4,
  hard: 0.65,
} as const;

/**
 * Absolute Goal target ceilings (points). Applied after ratio × maxScore.
 * Tune here when dense boards feel intimidating despite a low ratio.
 */
export const TARGET_CAPS = {
  easy: 48,
  medium: 75,
  hard: 105,
} as const;

export type Difficulty = keyof typeof TARGET_RATIOS;

export const TIMED_DURATIONS = [30, 60, 90, 120] as const;
export type TimedDuration = (typeof TIMED_DURATIONS)[number];

/**
 * Survival mode: countdown clock, each accepted word refills it. Starting
 * time is generous on Easy, stingy on Hard (players lean on refills sooner).
 */
export const SURVIVAL_START_SECONDS: Record<Difficulty, number> = {
  easy: 45,
  medium: 30,
  hard: 20,
};

/** Seconds of clock refilled per point, before difficulty scaling. */
export const SURVIVAL_SECONDS_PER_POINT = 3;

/** Refill multiplier by difficulty — Hard is stingier with time back. */
export const SURVIVAL_BONUS_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.2,
  medium: 1,
  hard: 0.7,
};

/** Every accepted word refills at least this much, even a bare min-length word. */
export const SURVIVAL_MIN_BONUS_SECONDS = 1;

/**
 * Bonus seconds for an accepted word: points (length - 2) scaled by
 * `SURVIVAL_SECONDS_PER_POINT` and the difficulty multiplier, rounded,
 * floored at `SURVIVAL_MIN_BONUS_SECONDS` so nothing ever refills for 0.
 */
export function survivalBonusSeconds(points: number, difficulty: Difficulty): number {
  const raw = points * SURVIVAL_SECONDS_PER_POINT * SURVIVAL_BONUS_MULTIPLIER[difficulty];
  return Math.max(SURVIVAL_MIN_BONUS_SECONDS, Math.round(raw));
}

export const GRID_SIZES = [4, 5, 6] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/**
 * Gen quality floors: count of board words with length ≥ N.
 * Not a max word length — 7+/8+/10+/… still score and count toward `total`.
 */
export type WordCountThresholds = {
  ge3: number;
  ge4: number;
  ge5: number;
  ge6: number;
  /** Soft floors — may scale to 0 on late retries (unlike ge6’s ≥1 keep). */
  ge7: number;
  ge8: number;
  /** Prefer a 10+ haul on big grids when the lexicon + paths allow. */
  ge10: number;
  total: number;
};

/**
 * Min-word thresholds by topology + grid size (default min length 3).
 * Hex is leaner — 6 neighbors vs 8 → fewer paths.
 * `ge5`/`ge6`/`ge7`/`ge8`/`ge10` = want enough mid/long words (not a ceiling).
 * Larger grids ask for more long finds while `ge3`/`total` still require a
 * short-word base. Every size keeps `ge6 ≥ 1`; retry scale never drops that
 * floor below 1. `ge7+` / `ge10` are soft (may loosen to 0); fallback ranking
 * still heavily prefers boards that land 8–10 letter words when possible.
 */
export const BOARD_THRESHOLDS: Record<GridTopology, Record<GridSize, WordCountThresholds>> = {
  square: {
    4: { ge3: 40, ge4: 15, ge5: 4, ge6: 1, ge7: 0, ge8: 0, ge10: 0, total: 50 },
    5: { ge3: 80, ge4: 40, ge5: 18, ge6: 8, ge7: 2, ge8: 1, ge10: 0, total: 100 },
    6: { ge3: 140, ge4: 72, ge5: 38, ge6: 18, ge7: 4, ge8: 2, ge10: 1, total: 180 },
  },
  hex: {
    4: { ge3: 25, ge4: 9, ge5: 2, ge6: 1, ge7: 0, ge8: 0, ge10: 0, total: 30 },
    5: { ge3: 50, ge4: 24, ge5: 10, ge6: 4, ge7: 1, ge8: 0, ge10: 0, total: 60 },
    6: { ge3: 90, ge4: 48, ge5: 22, ge6: 9, ge7: 2, ge8: 1, ge10: 0, total: 110 },
  },
};

export const HARD_TARGET_FLOOR = 15;
/** Extra attempts help rare 8+/10+ paths clear soft long-word floors on big grids. */
export const GEN_RETRY_CAP = 100;

/**
 * Targets from maxScore of words ≥ active min length.
 * Never exceeds maxScore (Hard floor clamps down when board is lean).
 * Dense boards: ratio result is also capped by `TARGET_CAPS` so Goal “pts left”
 * stays psychologically casual (not a direct stand-in for word count).
 */
export function computeTargets(maxScore: number): {
  easy: number;
  medium: number;
  hard: number;
} {
  const clamp = (n: number) => Math.min(maxScore, Math.max(0, n));
  return {
    easy: clamp(Math.min(TARGET_CAPS.easy, Math.ceil(maxScore * TARGET_RATIOS.easy))),
    medium: clamp(Math.min(TARGET_CAPS.medium, Math.ceil(maxScore * TARGET_RATIOS.medium))),
    hard: clamp(
      Math.min(
        TARGET_CAPS.hard,
        Math.max(HARD_TARGET_FLOOR, Math.ceil(maxScore * TARGET_RATIOS.hard)),
      ),
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
    ge7: base.ge7,
    ge8: base.ge8,
    ge10: base.ge10,
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

/**
 * Letter variety by difficulty. Board gen stays common-biased (fast first
 * success) but blends in more spread as difficulty rises:
 * - `flatten` (0-1 exponent on `LETTER_WEIGHTS`): lower = flatter distribution
 *   = rarer letters relatively more likely. 1 = unchanged common bias.
 * - `repeatPenalty`: how hard an already-placed letter is docked per repeat
 *   within one board, so a single board doesn't lean on the same few letters
 *   (Easy still needs a touch of this to avoid mono-vowel soup).
 */
export const LETTER_VARIETY: Record<Difficulty, { flatten: number; repeatPenalty: number }> = {
  easy: { flatten: 0.85, repeatPenalty: 0.35 },
  medium: { flatten: 0.6, repeatPenalty: 0.55 },
  hard: { flatten: 0.4, repeatPenalty: 0.75 },
};

/**
 * Per-tile pick weights for board gen: flattens `LETTER_WEIGHTS` toward
 * variety by difficulty, then docks letters already placed on this board so
 * they don't over-repeat. Never zeroes a letter out — gen thresholds still
 * decide if the resulting board is solvable enough.
 */
export function letterMixWeights(
  placedCounts: Readonly<Record<string, number>>,
  difficulty: Difficulty = "medium",
): Record<string, number> {
  const { flatten, repeatPenalty } = LETTER_VARIETY[difficulty];
  const weights: Record<string, number> = {};
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS)) {
    const flattened = weight ** flatten;
    const repeats = placedCounts[letter] ?? 0;
    weights[letter] = flattened / (1 + repeatPenalty * repeats);
  }
  return weights;
}
