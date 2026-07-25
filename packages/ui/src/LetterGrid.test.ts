import { describe, expect, it } from "vitest";
import { cellCenter, hexAspect, hexRowStyle } from "./hexLayout";
import {
  applyPathCell,
  isInBacktrackZone,
  isInTileHitZone,
  BACKTRACK_EDGE_MARGIN,
  TILE_HIT_EDGE_INSET,
} from "./pathCells";

describe("hexLayout", () => {
  it("places (0,0) center at half cell pitch (even row, no odd-r shift)", () => {
    const n = 4;
    const { w, h } = hexAspect(n);
    const c = cellCenter(0, 0, n, "hex");
    expect(c.x).toBeCloseTo((0.5 / w) * 100);
    expect(c.y).toBeCloseTo((0.5 / h) * 100);
  });

  it("shifts odd rows by half pitch", () => {
    const n = 4;
    const { w } = hexAspect(n);
    const even = cellCenter(0, 0, n, "hex");
    const odd = cellCenter(1, 0, n, "hex");
    expect(odd.x - even.x).toBeCloseTo((0.5 / w) * 100);
  });

  it("row style top/height match cellCenter vertical pitch", () => {
    const n = 5;
    const { h } = hexAspect(n);
    const row = hexRowStyle(2, n);
    expect(parseFloat(row.top)).toBeCloseTo(((2 * 0.75) / h) * 100);
    expect(parseFloat(row.height)).toBeCloseTo((1 / h) * 100);
    const c = cellCenter(2, 1, n, "hex");
    expect(c.y).toBeCloseTo(parseFloat(row.top) + parseFloat(row.height) / 2);
  });
});

describe("applyPathCell", () => {
  it("appends adjacent cells", () => {
    const a = { row: 0, col: 0 };
    const b = { row: 0, col: 1 };
    expect(applyPathCell([], a)).toEqual([a]);
    expect(applyPathCell([a], b)).toEqual([a, b]);
  });

  it("truncates when revisiting an earlier cell", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(applyPathCell(path, { row: 0, col: 1 })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(applyPathCell(path, { row: 0, col: 0 })).toEqual([{ row: 0, col: 0 }]);
  });

  it("ignores backtrack when allowBacktrack is false (corner graze)", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    // Diagonal transit often clips previous tile — must not pop.
    expect(
      applyPathCell(path, { row: 0, col: 0 }, undefined, {
        allowBacktrack: false,
      }),
    ).toBeNull();
    // New diagonal neighbor still appends.
    expect(
      applyPathCell(path, { row: 1, col: 0 }, undefined, {
        allowBacktrack: false,
      }),
    ).toEqual([...path, { row: 1, col: 0 }]);
  });

  it("pops previous when allowBacktrack is true", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(
      applyPathCell(path, { row: 0, col: 0 }, undefined, {
        allowBacktrack: true,
      }),
    ).toEqual([{ row: 0, col: 0 }]);
  });

  it("ignores same cell and non-adjacent new cells", () => {
    const path = [{ row: 0, col: 0 }];
    expect(applyPathCell(path, { row: 0, col: 0 })).toBeNull();
    expect(applyPathCell(path, { row: 0, col: 2 })).toBeNull();
  });
});

describe("isInBacktrackZone", () => {
  it("rejects edge/corner hits, accepts center", () => {
    expect(isInBacktrackZone(0.05, 0.05)).toBe(false);
    expect(isInBacktrackZone(0.5, 0.02)).toBe(false);
    expect(isInBacktrackZone(0.5, 0.5)).toBe(true);
    expect(isInBacktrackZone(BACKTRACK_EDGE_MARGIN, BACKTRACK_EDGE_MARGIN)).toBe(true);
    expect(isInBacktrackZone(BACKTRACK_EDGE_MARGIN - 0.01, 0.5)).toBe(false);
  });
});

describe("isInTileHitZone", () => {
  it("rejects fringe, accepts interior", () => {
    expect(isInTileHitZone(TILE_HIT_EDGE_INSET - 0.01, 0.5)).toBe(false);
    expect(isInTileHitZone(TILE_HIT_EDGE_INSET, 0.5)).toBe(true);
    expect(isInTileHitZone(0.5, 0.5)).toBe(true);
  });
});
