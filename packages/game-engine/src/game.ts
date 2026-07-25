import type { Dictionary } from "@couch-potato/dictionary";
import {
  MIN_WORD_LENGTH,
  scoreWord,
  type Difficulty,
  type MinWordLength,
  type TimedDuration,
} from "./config";
import type { Board } from "./generate";
import { isValidPath, wordFromPath, type Cell } from "./path";
import type { GridTopology } from "./topology";
import { compareWordsByLengthThenAlpha } from "./wordLists";

export type GameMode = "target" | "timed";
export type EndReason = "won" | "timeout" | "quit";

type ConfigBase = { minWordLength: MinWordLength };

export type GameConfig =
  | (ConfigBase & { mode: "target"; difficulty: Difficulty })
  | (ConfigBase & { mode: "timed"; duration: TimedDuration });

export type SubmitResult =
  | { ok: true; word: string; points: number; score: number; ended?: EndReason }
  | { ok: false; reason: "short" | "invalid" | "duplicate" | "bad_path" | "ended" };

export type GameState = {
  board: Board;
  config: GameConfig;
  /** Points earned this run (high scores / results). */
  score: number;
  found: string[];
  /** Initial target points (target mode); null in timed. */
  target: number | null;
  /**
   * Target mode: points left to clear (starts at `target`, floors at 0).
   * Win when remaining === 0. Timed: unused (null).
   */
  remaining: number | null;
  remainingMs: number | null;
  ended: EndReason | null;
};

export function createGame(board: Board, config: GameConfig): GameState {
  const minWordLength = config.minWordLength ?? MIN_WORD_LENGTH;
  const target =
    config.mode === "target" ? board.targets[config.difficulty] : null;
  if (
    config.mode === "target" &&
    target != null &&
    target > board.maxScore
  ) {
    throw new Error("Target exceeds board maxScore — gen/filter bug");
  }
  const remainingMs = config.mode === "timed" ? config.duration * 1000 : null;
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
  const remaining =
    state.remaining != null
      ? Math.max(0, state.remaining - points)
      : null;
  let ended: EndReason | null = null;
  if (remaining === 0) ended = "won";
  const next: GameState = { ...state, score, found, remaining, ended };
  return {
    state: next,
    result: { ok: true, word, points, score, ended: ended ?? undefined },
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

/** Missed longs: common words on the filtered board, longest first. */
export function missedLongWords(
  state: GameState,
  dict: Dictionary,
  limit = 8,
): string[] {
  const found = new Set(state.found);
  const floor = Math.max(5, state.config.minWordLength);
  return state.board.allWords
    .filter((w) => !found.has(w) && w.length >= floor && dict.isPopular(w))
    .sort(compareWordsByLengthThenAlpha)
    .slice(0, limit);
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
  return `${profileId}:${size}:${topology}:timed:${config.duration}:min${min}`;
}
