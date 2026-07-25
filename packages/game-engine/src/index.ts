export {
  MIN_WORD_LENGTH,
  MIN_WORD_LENGTH_OPTIONS,
  scoreWord,
  TARGET_RATIOS,
  TIMED_DURATIONS,
  SURVIVAL_START_SECONDS,
  SURVIVAL_SECONDS_PER_POINT,
  SURVIVAL_BONUS_MULTIPLIER,
  SURVIVAL_MIN_BONUS_SECONDS,
  survivalBonusSeconds,
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

export { isValidPath, wordFromPath, cellsEqual, type Cell } from "./path";

export {
  isAdjacent8,
  isAdjacentHex,
  isAdjacentCells,
  GRID_TOPOLOGIES,
  neighborDeltas,
  type GridTopology,
} from "./topology";

export { rotateLettersCW, rotateBoard } from "./rotate";

export { createSeededRng, pickWeighted, type Rng } from "./rng";
export { findAllWords } from "./findWords";
export { generateBoard, buildBoard, type Board, type GenerateOptions } from "./generate";
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

export {
  compareWordsByLengthThenAlpha,
  sortWordsByLengthThenAlpha,
  groupWordsByLength,
  type WordLengthGroup,
} from "./wordLists";
