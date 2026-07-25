export type Cell = { row: number; col: number };

export type LetterGridProps = {
  letters: string[][];
  selected?: Cell[];
  onPathChange?: (path: Cell[]) => void;
  onPathEnd?: (path: Cell[]) => void;
  /** Staggered tile drop when round is won. */
  dropping?: boolean;
  className?: string;
};

export function cellKey(c: Cell) {
  return `${c.row},${c.col}`;
}

export function cellsEqual(a: Cell, b: Cell) {
  return a.row === b.row && a.col === b.col;
}

export function isAdjacent(a: Cell, b: Cell) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

/**
 * Grow path, or truncate when revisiting an earlier cell (swipe backtrack).
 * Returns null when the path is unchanged.
 */
export function applyPathCell(path: Cell[], cell: Cell): Cell[] | null {
  const last = path[path.length - 1];
  if (last && cellsEqual(last, cell)) return null;

  const existing = path.findIndex((c) => cellsEqual(c, cell));
  if (existing >= 0) {
    return path.slice(0, existing + 1);
  }

  if (last && !isAdjacent(last, cell)) return null;
  return [...path, cell];
}
