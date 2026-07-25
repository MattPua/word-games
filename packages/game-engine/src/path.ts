export type Cell = { row: number; col: number };

export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isAdjacent8(a: Cell, b: Cell): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return Math.max(dr, dc) === 1;
}

/** Valid path: in-bounds, 8-neighbor steps, no reuse. */
export function isValidPath(path: Cell[], gridSize: number): boolean {
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
    if (i > 0 && !isAdjacent8(path[i - 1]!, c)) return false;
  }
  return true;
}

export function wordFromPath(letters: string[][], path: Cell[]): string {
  return path.map((c) => letters[c.row]![c.col]!).join("").toLowerCase();
}
