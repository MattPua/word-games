import { describe, expect, it } from "vitest";
import { applyPathCell, isInBacktrackZone, BACKTRACK_EDGE_MARGIN } from "./pathCells";

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
