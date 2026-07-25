import { createDictionary } from "@couch-potato/dictionary";
import { describe, expect, it } from "vitest";
import {
  GEN_RETRY_CAP,
  computeTargets,
  scoreWord,
} from "./config";
import { buildBoard, generateBoard } from "./generate";
import {
  createGame,
  quitGame,
  submitPath,
} from "./game";
import { isValidPath, wordFromPath } from "./path";
import { createSeededRng } from "./rng";
import {
  groupWordsByLength,
  sortWordsByLengthThenAlpha,
} from "./wordLists";

const miniDict = createDictionary(
  [
    "cat",
    "cats",
    "act",
    "acts",
    "sac",
    "sat",
    "tea",
    "eat",
    "ate",
    "set",
    "seat",
    "east",
    "caste",
    "cast",
  ],
  ["cat", "cats", "act", "tea", "eat", "seat", "east", "cast"],
);

describe("path", () => {
  it("rejects reuse and non-adjacent steps", () => {
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 0 },
        ],
        4,
      ),
    ).toBe(false);
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
        ],
        4,
      ),
    ).toBe(false);
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
        4,
      ),
    ).toBe(true);
  });
});

describe("scoring", () => {
  it("uses length - 2", () => {
    expect(scoreWord(3)).toBe(1);
    expect(scoreWord(5)).toBe(3);
    expect(scoreWord(2)).toBe(0);
  });
});

describe("wordLists", () => {
  it("sorts longest first then A→Z", () => {
    expect(sortWordsByLengthThenAlpha(["cat", "seat", "ate", "tea"])).toEqual([
      "seat",
      "ate",
      "cat",
      "tea",
    ]);
  });

  it("groups by length with A→Z inside", () => {
    expect(groupWordsByLength(["tea", "seat", "cat", "ate", "east"])).toEqual([
      { length: 4, words: ["east", "seat"] },
      { length: 3, words: ["ate", "cat", "tea"] },
    ]);
  });
});

describe("computeTargets", () => {
  it("never exceeds maxScore (achievable)", () => {
    const t = computeTargets(10);
    expect(t.easy).toBeLessThanOrEqual(10);
    expect(t.medium).toBeLessThanOrEqual(10);
    expect(t.hard).toBeLessThanOrEqual(10);
    expect(t.hard).toBe(10); // floor 15 clamps to max
  });
});

describe("game", () => {
  it("accepts words and quit → results so far", () => {
    const letters = [
      ["C", "A", "T", "S"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
    ];
    const board = {
      letters,
      size: 4 as const,
      allWords: ["cat", "cats", "act"],
      maxScore: 6,
      targets: { easy: 2, medium: 3, hard: 5 },
      minWordLength: 3 as const,
    };
    let state = createGame(board, {
      mode: "target",
      difficulty: "easy",
      minWordLength: 3,
    });
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(wordFromPath(letters, path)).toBe("cat");
    const sub = submitPath(state, path, miniDict);
    expect(sub.result.ok).toBe(true);
    state = sub.state;
    expect(state.score).toBe(1);
    state = quitGame(state);
    expect(state.ended).toBe("quit");
    expect(state.found).toEqual(["cat"]);
  });

  it("rejects words shorter than active minWordLength", () => {
    const letters = [
      ["C", "A", "T", "S"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
    ];
    const board = buildBoard(letters, miniDict, 4);
    expect(board.allWords.every((w) => w.length >= 4)).toBe(true);
    expect(board.targets.hard).toBeLessThanOrEqual(board.maxScore);

    let state = createGame(board, {
      mode: "target",
      difficulty: "easy",
      minWordLength: 4,
    });
    const short = submitPath(
      state,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
      miniDict,
    );
    expect(short.result).toEqual({ ok: false, reason: "short" });

    const ok = submitPath(
      state,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      miniDict,
    );
    expect(ok.result.ok).toBe(true);
  });

  it("target is achievable under raised min length", () => {
    const letters = [
      ["C", "A", "T", "S"],
      ["E", "A", "S", "T"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
    ];
    const board = buildBoard(letters, miniDict, 4);
    expect(board.maxScore).toBeGreaterThan(0);
    for (const d of ["easy", "medium", "hard"] as const) {
      expect(board.targets[d]).toBeLessThanOrEqual(board.maxScore);
    }
    const state = createGame(board, {
      mode: "target",
      difficulty: "hard",
      minWordLength: 4,
    });
    expect(state.target).toBeLessThanOrEqual(board.maxScore);
    expect(state.target).toBe(board.targets.hard);
  });
});

describe("generateBoard", () => {
  it("succeeds within retry cap on seeded RNG", () => {
    const rng = createSeededRng(42);
    const board = generateBoard({
      size: 4,
      dict: miniDict,
      rng,
      retryCap: GEN_RETRY_CAP,
    });
    expect(board.letters).toHaveLength(4);
    expect(board.targets.hard).toBeLessThanOrEqual(board.maxScore);
  });

  it("gen-within-retry-cap with richer word list", () => {
    const words = [
      "the","and","for","are","but","not","you","all","can","had","her","was","one","our","out",
      "day","get","has","him","his","how","man","new","now","old","see","way","who","boy","did",
      "its","let","put","say","she","too","use","dad","mom","car","run","sun","fun","red","big",
      "eat","tea","sea","set","sat","cat","bat","hat","mat","rat","pat","ear","era","art",
      "tar","ate","seat","east","teas","eats","star","rats","tars","arts",
      "beat","bear","bare","rate","tare","tear","rest","nest","sent","nets","tens",
    ];
    const unique = [...new Set(words)];
    const dict = createDictionary(unique, unique);
    const rng = createSeededRng(12345);
    const board = generateBoard({
      size: 4,
      dict,
      rng,
      retryCap: GEN_RETRY_CAP,
      minWordLength: 4,
    });
    expect(board.allWords.every((w) => w.length >= 4)).toBe(true);
    expect(board.targets.hard).toBeLessThanOrEqual(board.maxScore);
  });
});
