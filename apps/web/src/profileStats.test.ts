import { describe, expect, it } from "vitest";
import {
  applyRunToPaceStats,
  avgWordLength,
  avgWpm,
  defaultPaceStats,
  formatPaceStat,
  normalizePaceStats,
  seedPaceFromTimedHistory,
} from "./profileStats";

describe("normalizePaceStats", () => {
  it("defaults missing / junk to zeros", () => {
    expect(normalizePaceStats(undefined)).toEqual(defaultPaceStats());
    expect(normalizePaceStats({})).toEqual(defaultPaceStats());
    expect(normalizePaceStats({ totalLetters: -3, lengthWords: 1.9 } as never)).toEqual({
      totalLetters: 0,
      lengthWords: 1,
      playSeconds: 0,
      wpmWords: 0,
    });
  });
});

describe("applyRunToPaceStats", () => {
  it("accumulates letters for avg length even without play time", () => {
    const next = applyRunToPaceStats(defaultPaceStats(), {
      words: ["cat", "dogs"],
    });
    expect(next).toEqual({
      totalLetters: 7,
      lengthWords: 2,
      playSeconds: 0,
      wpmWords: 0,
    });
    expect(avgWordLength(next)).toBe(3.5);
    expect(avgWpm(next)).toBeNull();
  });

  it("credits WPM only when activePlayMs > 0", () => {
    const next = applyRunToPaceStats(defaultPaceStats(), {
      words: ["cat", "dog", "bird"],
      activePlayMs: 30_000,
    });
    expect(next.playSeconds).toBe(30);
    expect(next.wpmWords).toBe(3);
    expect(avgWpm(next)).toBe(6); // 3 words / 0.5 min
  });

  it("skips empty words for letter totals and WPM", () => {
    const next = applyRunToPaceStats(defaultPaceStats(), {
      words: ["", "hi"],
      activePlayMs: 60_000,
    });
    expect(next.totalLetters).toBe(2);
    expect(next.lengthWords).toBe(1);
    expect(next.wpmWords).toBe(1);
    expect(avgWpm(next)).toBe(1);
  });
});

describe("seedPaceFromTimedHistory", () => {
  it("sums timed duration + words; ignores goal/survival", () => {
    const seeded = seedPaceFromTimedHistory([
      { mode: "timed", wordsFound: 10, duration: 60 },
      { mode: "timed", wordsFound: 5, duration: 30 },
      { mode: "target", wordsFound: 20 },
      { mode: "survival", wordsFound: 8 },
      { mode: "timed", wordsFound: 3 }, // no duration
    ]);
    expect(seeded).toEqual({ playSeconds: 90, wpmWords: 15 });
  });
});

describe("formatPaceStat", () => {
  it("formats one decimal or em dash", () => {
    expect(formatPaceStat(null)).toBe("—");
    expect(formatPaceStat(4.26)).toBe("4.3");
    expect(formatPaceStat(12)).toBe("12.0");
  });
});
