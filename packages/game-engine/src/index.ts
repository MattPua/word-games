export {
  MIN_WORD_LENGTH,
  MIN_WORD_LENGTH_OPTIONS,
  scoreWord,
  TARGET_RATIOS,
  TIMED_DURATIONS,
  GRID_SIZES,
  BOARD_THRESHOLDS,
  GEN_RETRY_CAP,
  HARD_TARGET_FLOOR,
  computeTargets,
  thresholdsForMinLength,
  type Difficulty,
  type TimedDuration,
  type GridSize,
  type MinWordLength,
} from "./config";

export {
  isValidPath,
  isAdjacent8,
  wordFromPath,
  cellsEqual,
  type Cell,
} from "./path";

export { createSeededRng, pickWeighted, type Rng } from "./rng";
export { findAllWords } from "./findWords";
export {
  generateBoard,
  buildBoard,
  type Board,
  type GenerateOptions,
} from "./generate";
export {
  createGame,
  submitPath,
  tickTimer,
  quitGame,
  missedLongWords,
  highScoreKey,
  type GameMode,
  type EndReason,
  type GameConfig,
  type GameState,
  type SubmitResult,
} from "./game";
