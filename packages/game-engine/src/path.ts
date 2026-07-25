import {
  isAdjacentCells,
  type GridTopology,
} from "./topology";

export type Cell = { row: number; col: number };

export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Valid path: in-bounds, topology-neighbor steps, no reuse. */
export function isValidPath(
  path: Cell[],
  gridSize: number,
  topology: GridTopology = "square",
): boolean {
  if (path.length === 0) return false;
  const seen = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const c = path[i]!;
    if (c.row < 0 || c.col < 0 || c.row >= gridSize || c.col >= gridSize) {
      return false;
    }
    const key = `${c.row},${c.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (i > 0 && !isAdjacentCells(path[i - 1]!, c, topology)) return false;
  }
  return true;
}

export function wordFromPath(letters: string[][], path: Cell[]): string {
  return path.map((c) => letters[c.row]![c.col]!).join("").toLowerCase();
}
