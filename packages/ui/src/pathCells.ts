export type Cell = { row: number; col: number };

export type GridTopology = "square" | "hex";

export type LetterGridProps = {
  letters: string[][];
  selected?: Cell[];
  onPathChange?: (path: Cell[]) => void;
  onPathEnd?: (path: Cell[]) => void;
  /** Staggered tile drop when round is won. */
  dropping?: boolean;
  className?: string;
  topology?: GridTopology;
  /** Prefer engine `isAdjacentCells` bound to topology. Defaults to square 8-way. */
  isAdjacent?: (a: Cell, b: Cell) => boolean;
  /**
   * Visual board turn in degrees (±90 per step).
   * Glyphs counter-rotate so letters stay upright.
   */
  boardTurnDeg?: number;
  /** When true, CSS-transition `boardTurnDeg` (physical spin). */
  boardTurning?: boolean;
  /** When false, ignore pointer path input (e.g. mid-spin). Default true. */
  interactive?: boolean;
  /** Fires when a turning transition on the board container ends. */
  onBoardTurnEnd?: () => void;
};

export function cellKey(c: Cell) {
  return `${c.row},${c.col}`;
}

export function cellsEqual(a: Cell, b: Cell) {
  return a.row === b.row && a.col === b.col;
}

/** Square 8-way default (UI fallback when engine adjacency not passed). */
export function isAdjacent(a: Cell, b: Cell) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

/**
 * Edge inset (each side) for tile hit acceptance.
 * Gutter / near-edge hits are ignored so diagonal swipes don’t clip neighbors.
 * Visual gap (CSS tile margin) + this inset = dead zone between letters.
 */
export const TILE_HIT_EDGE_INSET = 0.1;

/** True when normalized cell/tile coords (0–1) are clearly inside the tile. */
export function isInTileHitZone(nx: number, ny: number, inset = TILE_HIT_EDGE_INSET): boolean {
  return nx >= inset && nx <= 1 - inset && ny >= inset && ny <= 1 - inset;
}

/**
 * Edge margin (each side) for backtrack hysteresis.
 * Pointer must be inside the inner (1 - 2·margin) square to pop/truncate —
 * corner grazes while aiming at a diagonal neighbor do not backtrack.
 */
export const BACKTRACK_EDGE_MARGIN = 0.28;

/** True when normalized tile coords (0–1) sit in the backtrack center zone. */
export function isInBacktrackZone(nx: number, ny: number, margin = BACKTRACK_EDGE_MARGIN): boolean {
  return nx >= margin && nx <= 1 - margin && ny >= margin && ny <= 1 - margin;
}

export type ApplyPathCellOptions = {
  /**
   * When false, revisiting an earlier cell is ignored (no pop/truncate).
   * LetterGrid sets this from center-zone hit testing so diagonal transit
   * that clips a previous tile corner does not false-backtrack.
   * Default true (unit tests / callers without geometry).
   */
  allowBacktrack?: boolean;
};

/**
 * Grow path, or truncate when revisiting an earlier cell (swipe backtrack).
 * Order: append adjacent-new → pop/truncate when allowed → else ignore.
 * Returns null when the path is unchanged.
 */
export function applyPathCell(
  path: Cell[],
  cell: Cell,
  adjacent: (a: Cell, b: Cell) => boolean = isAdjacent,
  options?: ApplyPathCellOptions,
): Cell[] | null {
  const last = path[path.length - 1];
  if (last && cellsEqual(last, cell)) return null;

  const existing = path.findIndex((c) => cellsEqual(c, cell));

  // Prefer append: adjacent to last and not already on path.
  if (existing < 0) {
    if (last && !adjacent(last, cell)) return null;
    return [...path, cell];
  }

  // Previous or earlier cell → pop / truncate only when committed.
  if (options?.allowBacktrack === false) return null;
  return path.slice(0, existing + 1);
}
