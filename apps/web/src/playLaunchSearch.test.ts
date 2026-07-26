import { describe, expect, it } from "vitest";
import {
  hasExplicitPlaySearch,
  playLaunchFromSearch,
  playSearchFromLaunch,
  validatePlaySearch,
} from "./playLaunchSearch";
import { normalizePlayLaunch } from "./storage";

describe("playLaunchSearch", () => {
  it("round-trips goal / timed / survival launches", () => {
    const goal = normalizePlayLaunch({
      mode: "target",
      grid: 5,
      topology: "hex",
      difficulty: "hard",
      minWordLength: 4,
    });
    expect(playSearchFromLaunch(goal)).toEqual({
      mode: "goal",
      grid: 5,
      board: "hex",
      min: 4,
      diff: "hard",
    });
    expect(playLaunchFromSearch(playSearchFromLaunch(goal))).toEqual(goal);

    const timed = normalizePlayLaunch({
      mode: "timed",
      grid: 4,
      topology: "square",
      duration: 90,
      minWordLength: 3,
    });
    expect(playSearchFromLaunch(timed)).toEqual({
      mode: "timed",
      grid: 4,
      board: "square",
      min: 3,
      time: 90,
    });
    expect(playLaunchFromSearch(playSearchFromLaunch(timed))).toEqual(timed);
  });

  it("accepts goal/target and honeycomb aliases", () => {
    expect(playLaunchFromSearch({ mode: "goal", board: "honeycomb" }).mode).toBe("target");
    expect(playLaunchFromSearch({ mode: "target", board: "honeycomb" }).topology).toBe("hex");
  });

  it("detects explicit vs bare search", () => {
    expect(hasExplicitPlaySearch({})).toBe(false);
    expect(hasExplicitPlaySearch({ mode: "timed" })).toBe(true);
  });

  it("validatePlaySearch fills from explicit params", () => {
    expect(
      validatePlaySearch({
        mode: "survival",
        grid: "6",
        board: "hex",
        diff: "easy",
        min: "5",
      }),
    ).toEqual({
      mode: "survival",
      grid: 6,
      board: "hex",
      min: 5,
      diff: "easy",
    });
  });
});
