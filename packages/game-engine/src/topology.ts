import type { Cell } from "./path";

/** Square = 8-way; hex = Honeycomb (odd-r offset), 6-way. */
export type GridTopology = "square" | "hex";

export const GRID_TOPOLOGIES = ["square", "hex"] as const;

/** Classic king-move adjacency on a square grid. */
export function isAdjacent8(a: Cell, b: Cell): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return Math.max(dr, dc) === 1;
}

/**
 * Pointy-top odd-r offset neighbors (Red Blob Games).
 * Even rows: NW/NE share col-1/col with row-1; odd rows shift east.
 */
export function isAdjacentHex(a: Cell, b: Cell): boolean {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (dr === 0 && Math.abs(dc) === 1) return true;
  const odd = (a.row & 1) === 1;
  if (dr === -1 || dr === 1) {
    if (odd) return dc === 0 || dc === 1;
    return dc === -1 || dc === 0;
  }
  return false;
}

export function isAdjacentCells(a: Cell, b: Cell, topology: GridTopology): boolean {
  return topology === "hex" ? isAdjacentHex(a, b) : isAdjacent8(a, b);
}

/** Neighbor offsets for DFS / path growth (in-bounds filtered by caller). */
export function neighborDeltas(topology: GridTopology, row: number): Cell[] {
  if (topology === "square") {
    return [
      { row: -1, col: -1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ];
  }
  const odd = (row & 1) === 1;
  if (odd) {
    return [
      { row: 0, col: 1 },
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ];
  }
  return [
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: 0, col: -1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
  ];
}
