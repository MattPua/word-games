import { describe, expect, it, vi, beforeEach } from "vitest";

const playScaleNote = vi.fn();
vi.mock("./sfx", () => ({
  playScaleNote: (...args: unknown[]) => playScaleNote(...args),
}));

const { pathSelectFrequency, pathSelectOnChange } = await import("./pathSelectSound");

describe("pathSelectFrequency", () => {
  it("is C major do–re–mi–fa–so–la–ti–do from C5", () => {
    const expected = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    for (let i = 0; i < expected.length; i++) {
      expect(pathSelectFrequency(i)).toBeCloseTo(expected[i]!, 1);
    }
    for (let i = 1; i < 8; i++) {
      expect(pathSelectFrequency(i)).toBeGreaterThan(pathSelectFrequency(i - 1));
    }
  });

  it("soft-caps so long paths stay listenable", () => {
    expect(pathSelectFrequency(40)).toBeLessThanOrEqual(2093);
  });
});

describe("pathSelectOnChange", () => {
  beforeEach(() => {
    playScaleNote.mockClear();
  });

  it("plays tip note on grow", () => {
    pathSelectOnChange(1, 0);
    pathSelectOnChange(2, 1);
    pathSelectOnChange(3, 2);
    expect(playScaleNote).toHaveBeenCalledTimes(3);
    expect(playScaleNote.mock.calls[0]![0]).toBeCloseTo(pathSelectFrequency(0), 1);
    expect(playScaleNote.mock.calls[1]![0]).toBeCloseTo(pathSelectFrequency(1), 1);
    expect(playScaleNote.mock.calls[2]![0]).toBeCloseTo(pathSelectFrequency(2), 1);
  });

  it("plays tip note on backtrack", () => {
    pathSelectOnChange(2, 3); // mi → re
    expect(playScaleNote).toHaveBeenCalledTimes(1);
    expect(playScaleNote.mock.calls[0]![0]).toBeCloseTo(pathSelectFrequency(1), 1);
  });

  it("stays silent on full clear", () => {
    pathSelectOnChange(0, 3);
    expect(playScaleNote).not.toHaveBeenCalled();
  });
});
