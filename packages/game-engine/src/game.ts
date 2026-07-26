import type { Dictionary } from "@couch-potato/dictionary";
import {
  MIN_WORD_LENGTH,
  scoreWord,
  survivalBonusSeconds,
  SURVIVAL_START_SECONDS,
  type Difficulty,
  type MinWordLength,
  type TimedDuration,
} from "./config";
import type { Board } from "./generate";
import { isValidPath, wordFromPath, type Cell } from "./path";
import type { GridTopology } from "./topology";
import { compareWordsByLengthThenAlpha } from "./wordLists";

export type GameMode = "target" | "timed" | "survival";
export type EndReason = "won" | "timeout" | "quit";

type ConfigBase = { minWordLength: MinWordLength };

export type GameConfig =
  | (ConfigBase & { mode: "target"; difficulty: Difficulty })
  | (ConfigBase & { mode: "timed"; duration: TimedDuration; difficulty: Difficulty })
  | (ConfigBase & { mode: "survival"; difficulty: Difficulty });

export type SubmitResult =
  | {
      ok: true;
      word: string;
      points: number;
      score: number;
      ended?: EndReason;
      /** Survival only — seconds just refilled onto the clock for this word. */
      bonusSeconds?: number;
    }
  | { ok: false; reason: "short" | "invalid" | "duplicate" | "bad_path" | "ended" };

export type GameState = {
  board: Board;
  config: GameConfig;
  /** Points earned this run (high scores / results). */
  score: number;
  found: string[];
  /** Initial target points (target mode); null in timed/survival. */
  target: number | null;
  /**
   * Target mode: points left to clear (starts at `target`, floors at 0).
   * Win when remaining === 0. Timed/survival: unused (null).
   */
  remaining: number | null;
  /**
   * Countdown clock, shared by timed (fixed) and survival (refills on
   * accept). `tickTimer` ends the run with "timeout" for either once it
   * hits 0; null in target mode.
   */
  remainingMs: number | null;
  ended: EndReason | null;
};

export function createGame(board: Board, config: GameConfig): GameState {
  const minWordLength = config.minWordLength ?? MIN_WORD_LENGTH;
  const target = config.mode === "target" ? board.targets[config.difficulty] : null;
  if (config.mode === "target" && target != null && target > board.maxScore) {
    throw new Error("Target exceeds board maxScore — gen/filter bug");
  }
  const remainingMs =
    config.mode === "timed"
      ? config.duration * 1000
      : config.mode === "survival"
        ? SURVIVAL_START_SECONDS[config.difficulty] * 1000
        : null;
  return {
    board,
    config: { ...config, minWordLength },
    score: 0,
    found: [],
    target,
    remaining: target,
    remainingMs,
    ended: null,
  };
}

export function submitPath(
  state: GameState,
  path: Cell[],
  dict: Dictionary,
): { state: GameState; result: SubmitResult } {
  if (state.ended) {
    return { state, result: { ok: false, reason: "ended" } };
  }
  if (!isValidPath(path, state.board.size, state.board.topology)) {
    return { state, result: { ok: false, reason: "bad_path" } };
  }
  const word = wordFromPath(state.board.letters, path);
  const minLen = state.config.minWordLength;
  if (word.length < minLen) {
    return { state, result: { ok: false, reason: "short" } };
  }
  if (!dict.has(word)) {
    return { state, result: { ok: false, reason: "invalid" } };
  }
  if (state.found.includes(word)) {
    return { state, result: { ok: false, reason: "duplicate" } };
  }
  const points = scoreWord(word.length);
  const score = state.score + points;
  const found = [...state.found, word];
  const remaining = state.remaining != null ? Math.max(0, state.remaining - points) : null;
  let bonusSeconds: number | undefined;
  let remainingMs = state.remainingMs;
  if (state.config.mode === "survival" && remainingMs != null) {
    bonusSeconds = survivalBonusSeconds(points, state.config.difficulty);
    remainingMs = remainingMs + bonusSeconds * 1000;
  }
  let ended: EndReason | null = null;
  if (remaining === 0) ended = "won";
  const next: GameState = { ...state, score, found, remaining, remainingMs, ended };
  return {
    state: next,
    result: { ok: true, word, points, score, ended: ended ?? undefined, bonusSeconds },
  };
}

export function tickTimer(state: GameState, deltaMs: number): GameState {
  if (state.ended || state.remainingMs == null) return state;
  const remainingMs = Math.max(0, state.remainingMs - deltaMs);
  if (remainingMs === 0) {
    return { ...state, remainingMs, ended: "timeout" };
  }
  return { ...state, remainingMs };
}

export function quitGame(state: GameState): GameState {
  if (state.ended) return state;
  return { ...state, ended: "quit" };
}

/**
 * Results tease: longest popular leftovers only (not full Words-left count).
 * Floor ≥ max(5, minWordLength); longest first; capped for UI.
 */
export function missedLongWords(state: GameState, dict: Dictionary, limit = 8): string[] {
  const found = new Set(state.found);
  const floor = Math.max(5, state.config.minWordLength);
  return state.board.allWords
    .filter((w) => !found.has(w) && w.length >= floor && dict.isPopular(w))
    .sort(compareWordsByLengthThenAlpha)
    .slice(0, limit);
}

/**
 * Other unfound board words after the long tease — mid-length leftovers.
 * Skips 3-letter crumbs (too many / too noisy for Results). `exclude` = words
 * already shown under Long ones left. Cap per length so dense boards don’t
 * dump a wall of 4-letter chips.
 */
export const MISSED_OTHER_PER_LENGTH = 6;

export function missedOtherWords(
  state: GameState,
  exclude: readonly string[] = [],
  perLength = MISSED_OTHER_PER_LENGTH,
): string[] {
  const found = new Set(state.found);
  const skip = new Set(exclude);
  const floor = Math.max(4, state.config.minWordLength);
  const sorted = state.board.allWords
    .filter((w) => !found.has(w) && !skip.has(w) && w.length >= floor)
    .sort(compareWordsByLengthThenAlpha);

  const kept: string[] = [];
  const usedByLen = new Map<number, number>();
  for (const w of sorted) {
    const n = usedByLen.get(w.length) ?? 0;
    if (n >= perLength) continue;
    usedByLen.set(w.length, n + 1);
    kept.push(w);
  }
  return kept;
}

export function highScoreKey(
  profileId: string,
  size: number,
  config: GameConfig,
  topology: GridTopology = "square",
): string {
  const min = config.minWordLength;
  if (config.mode === "target") {
    return `${profileId}:${size}:${topology}:target:${config.difficulty}:min${min}`;
  }
  if (config.mode === "survival") {
    return `${profileId}:${size}:${topology}:survival:${config.difficulty}:min${min}`;
  }
  return `${profileId}:${size}:${topology}:timed:${config.duration}:${config.difficulty}:min${min}`;
}
