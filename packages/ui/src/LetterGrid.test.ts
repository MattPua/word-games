import { describe, expect, it } from "vitest";
import { applyPathCell } from "./pathCells";

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
    expect(applyPathCell(path, { row: 0, col: 0 })).toEqual([
      { row: 0, col: 0 },
    ]);
  });

  it("ignores same cell and non-adjacent new cells", () => {
    const path = [{ row: 0, col: 0 }];
    expect(applyPathCell(path, { row: 0, col: 0 })).toBeNull();
    expect(applyPathCell(path, { row: 0, col: 2 })).toBeNull();
  });
});
