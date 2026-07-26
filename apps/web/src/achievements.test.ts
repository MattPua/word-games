import { describe, expect, it } from "vitest";
import {
  allTrackProgress,
  applyRunToAchievements,
  defaultAchievementCounts,
  formatSurvivalSeconds,
  lengthBucket,
  normalizeAchievementCounts,
  normalizeStageUnlockedAt,
  stageForValue,
  TRACKS,
  trackById,
  trackProgress,
  withGamesPlayed,
} from "./achievements";

function ctx(
  overrides: Parameters<typeof withGamesPlayed>[0] = defaultAchievementCounts(),
  gamesPlayed = 0,
) {
  return withGamesPlayed(overrides, gamesPlayed);
}

const FIXED_NOW = Date.UTC(2026, 6, 25, 15, 0, 0); // Jul 25, 2026

describe("lengthBucket", () => {
  it("buckets 3-8 exactly, 9+ together", () => {
    expect(lengthBucket(3)).toBe("3");
    expect(lengthBucket(4)).toBe("4");
    expect(lengthBucket(6)).toBe("6");
    expect(lengthBucket(7)).toBe("7");
    expect(lengthBucket(8)).toBe("8");
    expect(lengthBucket(9)).toBe("9plus");
    expect(lengthBucket(12)).toBe("9plus");
  });
});

describe("stageForValue", () => {
  it("counts cleared milestones", () => {
    expect(stageForValue(0, [10, 20, 30])).toBe(0);
    expect(stageForValue(10, [10, 20, 30])).toBe(1);
    expect(stageForValue(25, [10, 20, 30])).toBe(2);
    expect(stageForValue(999, [10, 20, 30])).toBe(3);
  });
});

describe("trackProgress", () => {
  it("computes progress toward next milestone from the previous one", () => {
    const track = trackById("words");
    const counts = { ...defaultAchievementCounts(), uniqueWords: Array(10).fill("") };
    // words milestones: [5, 15, 40, 100, 250, 500, 1000] -> stage 1 (>=5), next 15
    const p = trackProgress(ctx(counts), track);
    expect(p.stage).toBe(1);
    expect(p.nextMilestone).toBe(15);
    // progress from prev milestone 5 to next 15: (10 - 5) / (15 - 5) = 0.5
    expect(p.progress).toBeCloseTo(0.5);
    expect(p.maxed).toBe(false);
    expect(p.unlockedAt).toBeNull();
  });

  it("exposes persisted unlock stamps without inventing dates", () => {
    const stamp = FIXED_NOW;
    const counts = {
      ...defaultAchievementCounts(),
      uniqueWords: Array(10)
        .fill("x")
        .map((_, i) => `w${i}`),
      stageUnlockedAt: { words: [stamp] },
    };
    const p = trackProgress(ctx(counts), trackById("words"));
    expect(p.stage).toBe(1);
    expect(p.unlockedAt).toBe(stamp);
    expect(p.stageUnlockedAt[0]).toBe(stamp);
  });

  it("maxes out past the last milestone", () => {
    const track = trackById("len9plus");
    const counts = {
      ...defaultAchievementCounts(),
      lengthCounts: { ...defaultAchievementCounts().lengthCounts, "9plus": 999 },
    };
    const p = trackProgress(ctx(counts), track);
    expect(p.maxed).toBe(true);
    expect(p.nextMilestone).toBeNull();
    expect(p.progress).toBe(1);
  });

  it("zero value never divides by zero", () => {
    const track = trackById("points");
    const p = trackProgress(ctx(), track);
    expect(p.stage).toBe(0);
    expect(p.progress).toBe(0);
  });

  it("reads sessions from the injected gamesPlayed, not the counts blob", () => {
    const track = trackById("sessions");
    // sessions milestones: [1, 5, 10, 25, 50, 100, 250]
    const p = trackProgress(ctx(defaultAchievementCounts(), 5), track);
    expect(p.value).toBe(5);
    expect(p.stage).toBe(2);
  });

  it("tracks best single-run points and words independently of lifetime totals", () => {
    const counts = {
      ...defaultAchievementCounts(),
      totalPoints: 9999,
      bestRunPoints: 30,
      bestRunWords: 8,
    };
    const points = trackProgress(ctx(counts), trackById("bestRunPoints"));
    const words = trackProgress(ctx(counts), trackById("bestRunWords"));
    // bestRunPoints milestones: [10, 25, 50, ...] -> 30 clears stage 2
    expect(points.stage).toBe(2);
    // bestRunWords milestones: [5, 10, 15, ...] -> 8 clears stage 1
    expect(words.stage).toBe(1);
  });
});

describe("allTrackProgress", () => {
  it("returns one entry per track, same order as TRACKS", () => {
    const progress = allTrackProgress(ctx());
    expect(progress).toHaveLength(TRACKS.length);
    expect(progress[0]!.track.id).toBe("points");
  });
});

describe("applyRunToAchievements", () => {
  it("accumulates points, unique words, and length buckets", () => {
    const counts = defaultAchievementCounts();
    const { next, stageUps, touched } = applyRunToAchievements(
      counts,
      { mode: "target", points: 12, words: ["cat", "dogs", "cat"] }, // duplicate "cat" should not double-count unique
      1,
      FIXED_NOW,
    );
    expect(next.totalPoints).toBe(12);
    expect(next.uniqueWords.sort()).toEqual(["cat", "dogs"]);
    expect(next.lengthCounts["3"]).toBe(2); // "cat" counted twice (occurrences, not unique)
    expect(next.lengthCounts["4"]).toBe(1);
    expect(touched).toContain("points");
    expect(touched).toContain("words");
    expect(touched).toContain("len3");
    expect(touched).toContain("len4");
    expect(touched).toContain("sessions");
    expect(touched).toContain("bestRunPoints");
    expect(touched).toContain("bestRunWords");
    // words milestone[0] = 5, only 2 unique found -> no stage up yet
    expect(stageUps.find((s) => s.id === "words")).toBeUndefined();
    // sessions milestone[0] = 1, first ever run -> stage up
    expect(stageUps.find((s) => s.id === "sessions")?.stage).toBe(1);
  });

  it("normalizes word case before counting uniques", () => {
    const counts = defaultAchievementCounts();
    const { next } = applyRunToAchievements(
      counts,
      { mode: "target", points: 0, words: ["Cat", "CAT", "cat"] },
      1,
    );
    expect(next.uniqueWords).toEqual(["cat"]);
    expect(next.lengthCounts["3"]).toBe(3);
  });

  it("fires a stageUp when a run crosses a milestone", () => {
    const counts = { ...defaultAchievementCounts(), totalPoints: 45 };
    const { stageUps } = applyRunToAchievements(
      counts,
      { mode: "target", points: 10, words: [] }, // 45 -> 55, crosses points milestone[0] = 50
      3,
      FIXED_NOW,
    );
    const pointsStageUp = stageUps.find((s) => s.id === "points");
    expect(pointsStageUp).toBeDefined();
    expect(pointsStageUp?.stage).toBe(1);
    expect(pointsStageUp?.milestone).toBe(50);
    expect(pointsStageUp?.unlockedAt).toBe(FIXED_NOW);
  });

  it("stamps unlock dates for every newly cleared stage", () => {
    const counts = defaultAchievementCounts();
    // points milestones: [50, 150, ...] — one haul can clear multiple stages
    const { next, stageUps } = applyRunToAchievements(
      counts,
      { mode: "target", points: 200, words: [] },
      1,
      FIXED_NOW,
    );
    expect(next.stageUnlockedAt.points).toEqual([FIXED_NOW, FIXED_NOW]);
    const points = stageUps.find((s) => s.id === "points");
    expect(points?.stage).toBe(2);
    expect(points?.unlockedAt).toBe(FIXED_NOW);
  });

  it("does not overwrite an existing unlock stamp", () => {
    const earlier = Date.UTC(2026, 0, 1);
    const counts = {
      ...defaultAchievementCounts(),
      totalPoints: 50,
      stageUnlockedAt: { points: [earlier] },
    };
    // Already stage 1 (50 pts). Cross stage 2 (150) with this run.
    const { next, stageUps } = applyRunToAchievements(
      counts,
      { mode: "target", points: 100, words: [] },
      2,
      FIXED_NOW,
    );
    expect(next.stageUnlockedAt.points?.[0]).toBe(earlier);
    expect(next.stageUnlockedAt.points?.[1]).toBe(FIXED_NOW);
    expect(stageUps.find((s) => s.id === "points")?.unlockedAt).toBe(FIXED_NOW);
  });

  it("clamps negative points (never lowers the haul)", () => {
    const counts = defaultAchievementCounts();
    const { next } = applyRunToAchievements(counts, { mode: "target", points: -5, words: [] }, 1);
    expect(next.totalPoints).toBe(0);
    expect(next.bestRunPoints).toBe(0);
  });

  it("leaves survival counts untouched for non-survival runs", () => {
    const counts = defaultAchievementCounts();
    const { next } = applyRunToAchievements(
      counts,
      { mode: "timed", points: 10, words: ["cat"], durationSurvivedMs: 99_000 },
      1,
    );
    expect(next.survivalBestMs).toBe(0);
    expect(next.survivalWordsFound).toBe(0);
  });

  it("updates survival-specific tracks only for survival runs (extension point)", () => {
    const counts = defaultAchievementCounts();
    const { next, touched } = applyRunToAchievements(
      counts,
      { mode: "survival", points: 20, words: ["cat", "dogs"], durationSurvivedMs: 45_000 },
      1,
    );
    expect(next.survivalBestMs).toBe(45_000);
    expect(next.survivalWordsFound).toBe(2);
    expect(touched).toContain("survivalTime");
    expect(touched).toContain("survivalWords");

    // A second, shorter survival run should not lower the best time.
    const { next: next2 } = applyRunToAchievements(
      next,
      { mode: "survival", points: 5, words: ["ox"], durationSurvivedMs: 10_000 },
      2,
    );
    expect(next2.survivalBestMs).toBe(45_000);
    expect(next2.survivalWordsFound).toBe(3);
  });

  it("tracks the best single-run score and word count across runs", () => {
    const counts = defaultAchievementCounts();
    const { next: afterFirst } = applyRunToAchievements(
      counts,
      { mode: "target", points: 15, words: ["cat", "dogs", "hello"] },
      1,
    );
    expect(afterFirst.bestRunPoints).toBe(15);
    expect(afterFirst.bestRunWords).toBe(3);

    // A weaker second run should not lower either best-run record.
    const { next: afterSecond } = applyRunToAchievements(
      afterFirst,
      { mode: "target", points: 4, words: ["ox"] },
      2,
    );
    expect(afterSecond.bestRunPoints).toBe(15);
    expect(afterSecond.bestRunWords).toBe(3);

    // A stronger run raises both.
    const { next: afterThird, stageUps } = applyRunToAchievements(
      afterSecond,
      { mode: "target", points: 30, words: ["a", "b", "c", "d", "e"] },
      3,
    );
    expect(afterThird.bestRunPoints).toBe(30);
    expect(afterThird.bestRunWords).toBe(5);
    expect(stageUps.find((s) => s.id === "bestRunPoints")).toBeDefined();
    expect(stageUps.find((s) => s.id === "bestRunWords")).toBeDefined();
  });

  it("fires a sessions stageUp using the profile's post-increment run tally", () => {
    const counts = defaultAchievementCounts();
    // sessions milestones: [1, 5, 10, ...]; gamesPlayedAfter=5 -> before=4 (stage 1), after=5 (stage 2)
    const { stageUps } = applyRunToAchievements(
      counts,
      { mode: "target", points: 0, words: [] },
      5,
    );
    const sessionsStageUp = stageUps.find((s) => s.id === "sessions");
    expect(sessionsStageUp?.stage).toBe(2);
    expect(sessionsStageUp?.milestone).toBe(5);
  });
});

describe("normalizeAchievementCounts", () => {
  it("defaults a missing blob", () => {
    expect(normalizeAchievementCounts(undefined)).toEqual(defaultAchievementCounts());
  });

  it("backfills new fields (e.g. survival, best-run, unlock dates) onto an old blob", () => {
    const old = { totalPoints: 30, uniqueWords: ["Cat", "cat", "Dog"] };
    const next = normalizeAchievementCounts(old);
    expect(next.totalPoints).toBe(30);
    expect(next.uniqueWords.sort()).toEqual(["cat", "dog"]);
    expect(next.survivalBestMs).toBe(0);
    expect(next.survivalWordsFound).toBe(0);
    expect(next.bestRunPoints).toBe(0);
    expect(next.bestRunWords).toBe(0);
    expect(next.lengthCounts).toEqual(defaultAchievementCounts().lengthCounts);
    expect(next.stageUnlockedAt).toEqual({});
  });

  it("keeps valid unlock stamps and drops junk", () => {
    const next = normalizeAchievementCounts({
      totalPoints: 50,
      stageUnlockedAt: {
        points: [FIXED_NOW, -1, Number.NaN, "nope" as unknown as number],
        notATrack: [FIXED_NOW],
      } as never,
    });
    expect(next.stageUnlockedAt.points?.[0]).toBe(FIXED_NOW);
    expect(next.stageUnlockedAt.points?.[1]).toBeUndefined();
    expect(next.stageUnlockedAt).not.toHaveProperty("notATrack");
  });
});

describe("normalizeStageUnlockedAt", () => {
  it("returns empty for missing / non-object input", () => {
    expect(normalizeStageUnlockedAt(undefined)).toEqual({});
    expect(normalizeStageUnlockedAt(null)).toEqual({});
  });
});

describe("formatSurvivalSeconds", () => {
  it("formats under a minute as seconds", () => {
    expect(formatSurvivalSeconds(45)).toBe("45s");
  });

  it("formats whole minutes without seconds", () => {
    expect(formatSurvivalSeconds(120)).toBe("2m");
  });

  it("formats minutes and seconds", () => {
    expect(formatSurvivalSeconds(90)).toBe("1m 30s");
  });
});
