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
  let ge3 = 0,
    ge4 = 0,
    ge5 = 0,
    ge6 = 0;
  for (const w of words) {
    const n = w.length;
    if (n >= 3) ge3++;
    if (n >= 4) ge4++;
    if (n >= 5) ge5++;
    if (n >= 6) ge6++;
  }
  return { ge3, ge4, ge5, ge6, total: words.length };
}

function meetsThresholds(counts: WordCountThresholds, t: WordCountThresholds, scale = 1): boolean {
  return (
    counts.ge3 >= Math.floor(t.ge3 * scale) &&
    counts.ge4 >= Math.floor(t.ge4 * scale) &&
    counts.ge5 >= Math.floor(t.ge5 * scale) &&
    counts.ge6 >= Math.floor(t.ge6 * scale) &&
    counts.total >= Math.floor(t.total * scale)
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
  // allWords = popular-only (via findAllWords) ≥ minWordLength
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
    // allWords is popular-only; ratio stays as a sanity signal for gen quality
    const popular = popularRatio(board.allWords, opts.dict);
    const hardOk = board.targets.hard <= board.maxScore && board.maxScore > 0;
    const floorOk = board.maxScore >= HARD_TARGET_FLOOR || minWordLength > 3;
    const quality = board.allWords.length * 0.5 + popular * 100 + (hardOk && floorOk ? 20 : 0);

    if (quality > bestScore) {
      bestScore = quality;
      best = board;
    }

    const scale = attempt < cap / 2 ? 1 : 0.75;
    if (
      hardOk &&
      meetsThresholds(counts, thresholds, scale) &&
      (floorOk || attempt > cap * 0.6) &&
      popular >= 0.99
    ) {
      return board;
    }
  }

  if (!best) throw new Error("Board generation failed");
  return {
    ...best,
    targets: computeTargets(best.maxScore),
  };
}
