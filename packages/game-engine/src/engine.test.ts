import { createDictionary } from "@couch-potato/dictionary";
import { describe, expect, it } from "vitest";
import { GEN_RETRY_CAP, computeTargets, scoreWord } from "./config";
import { buildBoard, generateBoard } from "./generate";
import { createGame, highScoreKey, quitGame, submitPath } from "./game";
import { isValidPath, wordFromPath } from "./path";
import { createSeededRng } from "./rng";
import { rotateBoard, rotateLettersCW } from "./rotate";
import { isAdjacent8, isAdjacentHex, isAdjacentCells } from "./topology";
import { groupWordsByLength, sortWordsByLengthThenAlpha } from "./wordLists";

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
  it("square rejects reuse and non-adjacent steps; allows diagonal", () => {
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 0 },
        ],
        4,
        "square",
      ),
    ).toBe(false);
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
        ],
        4,
        "square",
      ),
    ).toBe(false);
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
        4,
        "square",
      ),
    ).toBe(true);
  });

  it("hex is 6-way odd-r — no diagonal that square allows on even rows", () => {
    // Even row: (0,0) neighbors include (1,0) and (1,-1) but NOT (1,1)
    expect(isAdjacentHex({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
    expect(isAdjacentHex({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false);
    expect(isAdjacent8({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(true);
    // Odd row: (1,1) neighbors include (0,1),(0,2),(2,1),(2,2)
    expect(isAdjacentHex({ row: 1, col: 1 }, { row: 0, col: 2 })).toBe(true);
    expect(isAdjacentHex({ row: 1, col: 1 }, { row: 0, col: 0 })).toBe(false);
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
        4,
        "hex",
      ),
    ).toBe(false);
    expect(
      isValidPath(
        [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
        ],
        4,
        "hex",
      ),
    ).toBe(true);
  });
});

describe("rotate", () => {
  it("square 90° CW maps (r,c) → (c, n-1-r)", () => {
    const letters = [
      ["A", "B"],
      ["C", "D"],
    ];
    expect(rotateLettersCW(letters, "square")).toEqual([
      ["C", "A"],
      ["D", "B"],
    ]);
  });

  it("hex uses the same 90° CW map as square", () => {
    const letters = [
      ["A", "B"],
      ["C", "D"],
    ];
    expect(rotateLettersCW(letters, "hex")).toEqual([
      ["C", "A"],
      ["D", "B"],
    ]);
  });

  it("rotateBoard(-1) is 90° CCW", () => {
    const letters = [
      ["A", "B"],
      ["C", "D"],
    ];
    expect(
      rotateBoard(
        {
          letters,
          size: 2,
          topology: "square",
          allWords: [],
          maxScore: 0,
          targets: { easy: 0, medium: 0, hard: 0 },
          minWordLength: 3,
        },
        -1,
      ).letters,
    ).toEqual([
      ["B", "D"],
      ["A", "C"],
    ]);
  });
});

describe("highScoreKey", () => {
  it("includes topology", () => {
    const cfg = {
      mode: "target" as const,
      difficulty: "easy" as const,
      minWordLength: 3 as const,
    };
    expect(highScoreKey("p1", 4, cfg, "square")).toBe("p1:4:square:target:easy:min3");
    expect(highScoreKey("p1", 4, cfg, "hex")).toBe("p1:4:hex:target:easy:min3");
    expect(highScoreKey("p1", 4, cfg, "square")).not.toBe(highScoreKey("p1", 4, cfg, "hex"));
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
      topology: "square" as const,
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
    expect(state.remaining).toBe(1); // easy target 2 − 1
    state = quitGame(state);
    expect(state.ended).toBe("quit");
    expect(state.found).toEqual(["cat"]);
  });

  it("wins when remaining hits 0", () => {
    const letters = [
      ["C", "A", "T", "S"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
    ];
    const board = {
      letters,
      size: 4 as const,
      topology: "square" as const,
      allWords: ["cat", "cats"],
      maxScore: 4,
      targets: { easy: 1, medium: 2, hard: 3 },
      minWordLength: 3 as const,
    };
    let state = createGame(board, {
      mode: "target",
      difficulty: "easy",
      minWordLength: 3,
    });
    expect(state.remaining).toBe(1);
    const sub = submitPath(
      state,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
      miniDict,
    );
    expect(sub.result.ok).toBe(true);
    expect(sub.state.remaining).toBe(0);
    expect(sub.state.ended).toBe("won");
    expect(sub.state.score).toBe(1);
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
  it("excludes obscure enable1-only words from allWords", () => {
    // Board spells AALII (obscure) and CAT (popular) — only CAT counts.
    const letters = [
      ["A", "A", "L", "I"],
      ["I", "C", "A", "T"],
      ["X", "X", "X", "X"],
      ["X", "X", "X", "X"],
    ];
    const dict = createDictionary(["aalii", "cat", "act", "ail"], ["cat", "act"]);
    const board = buildBoard(letters, dict, 3);
    expect(board.allWords).not.toContain("aalii");
    expect(board.allWords.every((w) => dict.isPopular(w))).toBe(true);
    expect(dict.has("aalii")).toBe(false);
    expect(dict.has("cat")).toBe(true);
  });

  it("succeeds within retry cap on seeded RNG (square)", () => {
    const rng = createSeededRng(42);
    const board = generateBoard({
      size: 4,
      dict: miniDict,
      topology: "square",
      rng,
      retryCap: GEN_RETRY_CAP,
    });
    expect(board.topology).toBe("square");
    expect(board.letters).toHaveLength(4);
    expect(board.targets.hard).toBeLessThanOrEqual(board.maxScore);
  });

  it("succeeds within retry cap on seeded RNG (hex)", () => {
    const rng = createSeededRng(42);
    const board = generateBoard({
      size: 4,
      dict: miniDict,
      topology: "hex",
      rng,
      retryCap: GEN_RETRY_CAP,
    });
    expect(board.topology).toBe("hex");
    expect(board.letters).toHaveLength(4);
    expect(board.targets.hard).toBeLessThanOrEqual(board.maxScore);
  });

  it("gen-within-retry-cap with richer word list", () => {
    const words = [
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
      "her",
      "was",
      "one",
      "our",
      "out",
      "day",
      "get",
      "has",
      "him",
      "his",
      "how",
      "man",
      "new",
      "now",
      "old",
      "see",
      "way",
      "who",
      "boy",
      "did",
      "its",
      "let",
      "put",
      "say",
      "she",
      "too",
      "use",
      "dad",
      "mom",
      "car",
      "run",
      "sun",
      "fun",
      "red",
      "big",
      "eat",
      "tea",
      "sea",
      "set",
      "sat",
      "cat",
      "bat",
      "hat",
      "mat",
      "rat",
      "pat",
      "ear",
      "era",
      "art",
      "tar",
      "ate",
      "seat",
      "east",
      "teas",
      "eats",
      "star",
      "rats",
      "tars",
      "arts",
      "beat",
      "bear",
      "bare",
      "rate",
      "tare",
      "tear",
      "rest",
      "nest",
      "sent",
      "nets",
      "tens",
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

describe("adjacency helpers", () => {
  it("isAdjacentCells dispatches topology", () => {
    const a = { row: 0, col: 0 };
    const diag = { row: 1, col: 1 };
    expect(isAdjacentCells(a, diag, "square")).toBe(true);
    expect(isAdjacentCells(a, diag, "hex")).toBe(false);
  });
});
