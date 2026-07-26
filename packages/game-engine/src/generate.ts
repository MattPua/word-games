import type { Dictionary } from "@couch-potato/dictionary";
import {
  BOARD_THRESHOLDS,
  GEN_RETRY_CAP,
  HARD_TARGET_FLOOR,
  MIN_WORD_LENGTH,
  computeTargets,
  letterMixWeights,
  thresholdsForMinLength,
  type Difficulty,
  type GridSize,
  type MinWordLength,
  type WordCountThresholds,
  scoreWord,
} from "./config";
import { findAllWords } from "./findWords";
import { createSeededRng, pickWeighted, type Rng } from "./rng";
import type { GridTopology } from "./topology";

export type Board = {
  letters: string[][];
  size: GridSize;
  topology: GridTopology;
  /** Words meeting the active min length (scoring / missed / max). */
  allWords: string[];
  maxScore: number;
  targets: { easy: number; medium: number; hard: number };
  minWordLength: MinWordLength;
};

function countByLength(words: string[]): WordCountThresholds {
  // Cumulative ≥N buckets for gen quality — not exclusive length bins / not a max.
  let ge3 = 0,
    ge4 = 0,
    ge5 = 0,
    ge6 = 0,
    ge7 = 0,
    ge8 = 0,
    ge10 = 0;
  for (const w of words) {
    const n = w.length;
    if (n >= 3) ge3++;
    if (n >= 4) ge4++;
    if (n >= 5) ge5++;
    if (n >= 6) ge6++;
    if (n >= 7) ge7++;
    if (n >= 8) ge8++;
    if (n >= 10) ge10++;
  }
  return { ge3, ge4, ge5, ge6, ge7, ge8, ge10, total: words.length };
}

/** Scaled floor for a threshold. `ge6` never drops below 1 when the table asks for ≥1. */
function scaledNeed(threshold: number, scale: number, keepAtLeastOne: boolean): number {
  if (threshold <= 0) return 0;
  const scaled = Math.floor(threshold * scale);
  return keepAtLeastOne ? Math.max(1, scaled) : scaled;
}

function meetsThresholds(counts: WordCountThresholds, t: WordCountThresholds, scale = 1): boolean {
  return (
    counts.ge3 >= scaledNeed(t.ge3, scale, false) &&
    counts.ge4 >= scaledNeed(t.ge4, scale, false) &&
    counts.ge5 >= scaledNeed(t.ge5, scale, false) &&
    counts.ge6 >= scaledNeed(t.ge6, scale, true) &&
    // Soft long floors — OK to loosen fully on late retries.
    counts.ge7 >= scaledNeed(t.ge7, scale, false) &&
    counts.ge8 >= scaledNeed(t.ge8, scale, false) &&
    counts.ge10 >= scaledNeed(t.ge10, scale, false) &&
    counts.total >= scaledNeed(t.total, scale, false)
  );
}

/**
 * Fills the board tile by tile, re-weighting after every pick: `letterMixWeights`
 * flattens toward variety by difficulty and docks letters already placed, so a
 * single board doesn't lean on the same few common letters.
 */
function randomBoard(size: GridSize, rng: Rng, difficulty: Difficulty = "medium"): string[][] {
  const placedCounts: Record<string, number> = {};
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => {
      const letter = pickWeighted(letterMixWeights(placedCounts, difficulty), rng);
      placedCounts[letter] = (placedCounts[letter] ?? 0) + 1;
      return letter.toUpperCase();
    }),
  );
}

function popularRatio(words: string[], dict: Dictionary): number {
  if (words.length === 0) return 0;
  let n = 0;
  for (const w of words) if (dict.isPopular(w)) n++;
  return n / words.length;
}

export function buildBoard(
  letters: string[][],
  dict: Dictionary,
  minWordLength: MinWordLength = MIN_WORD_LENGTH,
  topology: GridTopology = "square",
): Board {
  const size = letters.length as GridSize;
  // allWords = ENABLE play lexicon (via findAllWords) ≥ minWordLength
  const allWords = findAllWords(letters, dict, topology).filter((w) => w.length >= minWordLength);
  const maxScore = allWords.reduce((s, w) => s + scoreWord(w.length), 0);
  const targets = computeTargets(maxScore);
  return {
    letters,
    size,
    topology,
    allWords,
    maxScore,
    targets,
    minWordLength,
  };
}

export type GenerateOptions = {
  size: GridSize;
  dict: Dictionary;
  topology?: GridTopology;
  minWordLength?: MinWordLength;
  /** Letter variety mix (see `LETTER_VARIETY`). Timed has no difficulty — defaults to "medium". */
  difficulty?: Difficulty;
  seed?: number;
  rng?: Rng;
  retryCap?: number;
};

/**
 * Generate a quality board for the active min word length.
 * Max score / targets use only words ≥ minWordLength (targets always ≤ maxScore).
 */
export function generateBoard(opts: GenerateOptions): Board {
  const minWordLength = opts.minWordLength ?? MIN_WORD_LENGTH;
  const topology = opts.topology ?? "square";
  const difficulty = opts.difficulty ?? "medium";
  const rng = opts.rng ?? createSeededRng(opts.seed ?? Date.now());
  const cap = opts.retryCap ?? GEN_RETRY_CAP;
  const thresholds = thresholdsForMinLength(BOARD_THRESHOLDS[topology][opts.size], minWordLength);

  let best: Board | null = null;
  let bestScore = -1;

  for (let attempt = 0; attempt < cap; attempt++) {
    const letters = randomBoard(opts.size, rng, difficulty);
    const board = buildBoard(letters, opts.dict, minWordLength, topology);
    const counts = countByLength(board.allWords);
    // Prefer boards with more everyday (popular) words among ENABLE finds.
    const popular = popularRatio(board.allWords, opts.dict);
    const hardOk = board.targets.hard <= board.maxScore && board.maxScore > 0;
    const floorOk = board.maxScore >= HARD_TARGET_FLOOR || minWordLength > 3;
    // Prefer meatier hauls when picking best-effort fallback — weight rare
    // 8+/10+ finds hard so boards that can land them win the ranking.
    const longWordBonus =
      counts.ge5 * 2 +
      counts.ge6 * 8 +
      counts.ge7 * 20 +
      counts.ge8 * 45 +
      counts.ge10 * 120;
    const quality =
      board.allWords.length * 0.4 + popular * 100 + (hardOk && floorOk ? 20 : 0) + longWordBonus;

    if (quality > bestScore) {
      bestScore = quality;
      best = board;
    }

    const scale = attempt < cap / 2 ? 1 : 0.75;
    if (hardOk && meetsThresholds(counts, thresholds, scale) && (floorOk || attempt > cap * 0.6)) {
      return board;
    }
  }

  if (!best) throw new Error("Board generation failed");
  return {
    ...best,
    targets: computeTargets(best.maxScore),
  };
}
