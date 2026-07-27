import { describe, expect, it } from "vitest";
import { cellCenter, hexAspect, hexRowStyle } from "./hexLayout";
import {
  applyPathCell,
  isInBacktrackZone,
  isInTileHitZone,
  allowBacktrackForCell,
  BACKTRACK_EDGE_MARGIN,
  TILE_HIT_EDGE_INSET,
} from "./pathCells";

describe("hexLayout", () => {
  it("places (0,0) center at half cell pitch (even column, no odd-r shove)", () => {
    const n = 4;
    const { w, h } = hexAspect(n);
    const c = cellCenter(0, 0, n, "hex");
    expect(c.x).toBeCloseTo((0.5 / w) * 100);
    expect(c.y).toBeCloseTo((0.5 / h) * 100);
  });

  it("shifts odd data-rows down by half pitch (vertical columns)", () => {
    const n = 4;
    const { h } = hexAspect(n);
    const even = cellCenter(0, 0, n, "hex");
    const odd = cellCenter(1, 0, n, "hex");
    expect(odd.y - even.y).toBeCloseTo((0.5 / h) * 100);
  });

  it("column style left/width match cellCenter horizontal pitch", () => {
    const n = 5;
    const { w } = hexAspect(n);
    const col = hexRowStyle(2, n);
    expect(parseFloat(col.left)).toBeCloseTo(((2 * 0.75) / w) * 100);
    expect(parseFloat(col.width)).toBeCloseTo((1 / w) * 100);
    const c = cellCenter(2, 1, n, "hex");
    expect(c.x).toBeCloseTo(parseFloat(col.left) + parseFloat(col.width) / 2);
  });

  it("board is taller than wide (vertical focus)", () => {
    const { w, h } = hexAspect(5);
    expect(h).toBeGreaterThan(w);
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

describe("allowBacktrackForCell", () => {
  it("allows immediate previous without center zone", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(allowBacktrackForCell(path, { row: 0, col: 1 }, false)).toBe(true);
  });

  it("requires center zone for deeper path cells", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(allowBacktrackForCell(path, { row: 0, col: 0 }, false)).toBe(false);
    expect(allowBacktrackForCell(path, { row: 0, col: 0 }, true)).toBe(true);
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
