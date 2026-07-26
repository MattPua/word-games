import { createDictionary } from "@couch-potato/dictionary";
import { describe, expect, it } from "vitest";
import {
  BOARD_THRESHOLDS,
  GEN_RETRY_CAP,
  SURVIVAL_START_SECONDS,
  TARGET_RATIOS,
  TARGET_CAPS,
  computeTargets,
  letterMixWeights,
  scoreWord,
  survivalBonusSeconds,
  thresholdsForDifficulty,
} from "./config";
import { findAllWords, findPathForWord } from "./findWords";
import { buildBoard, generateBoard } from "./generate";
import {
  createGame,
  highScoreKey,
  missedLongWords,
  MISSED_OTHER_PER_LENGTH,
  missedOtherWords,
  quitGame,
  submitPath,
  tickTimer,
} from "./game";
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
          // rotateBoard only reads letters/topology; size stubbed to satisfy Board's GridSize.
          size: 4,
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

  it("keys survival by difficulty, distinct from target", () => {
    const survivalCfg = {
      mode: "survival" as const,
      difficulty: "hard" as const,
      minWordLength: 3 as const,
    };
    const targetCfg = {
      mode: "target" as const,
      difficulty: "hard" as const,
      minWordLength: 3 as const,
    };
    expect(highScoreKey("p1", 4, survivalCfg, "square")).toBe("p1:4:square:survival:hard:min3");
    expect(highScoreKey("p1", 4, survivalCfg, "square")).not.toBe(
      highScoreKey("p1", 4, targetCfg, "square"),
    );
  });

  it("keys timed by duration and difficulty", () => {
    const cfg = {
      mode: "timed" as const,
      duration: 60 as const,
      difficulty: "hard" as const,
      minWordLength: 3 as const,
    };
    expect(highScoreKey("p1", 4, cfg, "square")).toBe("p1:4:square:timed:60:hard:min3");
    expect(highScoreKey("p1", 4, { ...cfg, difficulty: "easy" }, "square")).not.toBe(
      highScoreKey("p1", 4, cfg, "square"),
    );
  });
});

describe("survivalBonusSeconds", () => {
  it("scales with points and rounds", () => {
    expect(survivalBonusSeconds(1, "medium")).toBe(3); // 1 * 3 * 1
    expect(survivalBonusSeconds(3, "medium")).toBe(9); // 3 * 3 * 1
  });

  it("easy is more generous than medium, hard is stingier", () => {
    const points = 3;
    expect(survivalBonusSeconds(points, "easy")).toBeGreaterThan(
      survivalBonusSeconds(points, "medium"),
    );
    expect(survivalBonusSeconds(points, "hard")).toBeLessThan(
      survivalBonusSeconds(points, "medium"),
    );
  });

  it("never refills for 0 seconds, even at minimum points", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      expect(survivalBonusSeconds(1, difficulty)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("survival mode", () => {
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
  const catPath = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ];

  it("starts the clock from SURVIVAL_START_SECONDS by difficulty, no points target", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const state = createGame(board, { mode: "survival", difficulty, minWordLength: 3 });
      expect(state.remainingMs).toBe(SURVIVAL_START_SECONDS[difficulty] * 1000);
      expect(state.target).toBeNull();
      expect(state.remaining).toBeNull();
    }
  });

  it("accepting a word refills the clock and still scores points", () => {
    let state = createGame(board, { mode: "survival", difficulty: "medium", minWordLength: 3 });
    const startMs = state.remainingMs!;
    const sub = submitPath(state, catPath, miniDict);
    expect(sub.result.ok).toBe(true);
    if (!sub.result.ok) throw new Error("expected ok");
    expect(sub.result.points).toBe(1); // "cat" length 3 -> points 1
    expect(sub.result.bonusSeconds).toBe(survivalBonusSeconds(1, "medium"));
    state = sub.state;
    expect(state.score).toBe(1);
    expect(state.remainingMs).toBe(startMs + sub.result.bonusSeconds! * 1000);
  });

  it("ends with timeout when the clock ticks to 0", () => {
    let state = createGame(board, { mode: "survival", difficulty: "hard", minWordLength: 3 });
    state = tickTimer(state, SURVIVAL_START_SECONDS.hard * 1000 - 1);
    expect(state.ended).toBeNull();
    state = tickTimer(state, 1);
    expect(state.remainingMs).toBe(0);
    expect(state.ended).toBe("timeout");
  });

  it("quit mid-run still ends with results so far", () => {
    let state = createGame(board, { mode: "survival", difficulty: "easy", minWordLength: 3 });
    state = submitPath(state, catPath, miniDict).state;
    state = quitGame(state);
    expect(state.ended).toBe("quit");
    expect(state.found).toEqual(["cat"]);
  });
});

describe("scoring", () => {
  it("uses length - 2", () => {
    expect(scoreWord(3)).toBe(1);
    expect(scoreWord(5)).toBe(3);
    expect(scoreWord(7)).toBe(5);
    expect(scoreWord(8)).toBe(6);
    expect(scoreWord(2)).toBe(0);
  });
});

describe("long words (no max length)", () => {
  /** Kitchen snake: row0 KITC → down CHEN on col3. */
  const kitchenLetters = [
    ["K", "I", "T", "C"],
    ["X", "X", "X", "H"],
    ["X", "X", "X", "E"],
    ["X", "X", "X", "N"],
  ];
  const kitchenPath = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 1, col: 3 },
    { row: 2, col: 3 },
    { row: 3, col: 3 },
  ];

  /** Chainsaw snake (8): C-H-A-I-N-S-A-W. */
  const chainsawLetters = [
    ["C", "H", "A", "I"],
    ["X", "X", "X", "N"],
    ["X", "X", "A", "S"],
    ["X", "X", "W", "X"],
  ];
  const chainsawPath = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 1, col: 3 },
    { row: 2, col: 3 },
    { row: 2, col: 2 },
    { row: 3, col: 2 },
  ];

  it("findAllWords includes 7+ letter popular words when the path exists", () => {
    const dict = createDictionary(
      ["kitchen", "kit", "itch", "chin", "hen"],
      ["kitchen", "kit", "itch", "chin", "hen"],
    );
    const found = findAllWords(kitchenLetters, dict, "square");
    expect(found).toContain("kitchen");
    expect(found.some((w) => w.length >= 7)).toBe(true);
  });

  it("findPathForWord returns a valid path that spells the word", () => {
    const path = findPathForWord(kitchenLetters, "KITCHEN", "square");
    expect(path).toEqual(kitchenPath);
    expect(wordFromPath(kitchenLetters, path!)).toBe("kitchen");
    expect(findPathForWord(kitchenLetters, "nope", "square")).toBeNull();
  });

  it("accepts a 7-letter word on a supporting board", () => {
    const dict = createDictionary(["kitchen", "kit"], ["kitchen", "kit"]);
    const board = buildBoard(kitchenLetters, dict, 3, "square");
    expect(board.allWords).toContain("kitchen");
    const state = createGame(board, {
      mode: "timed",
      duration: 60,
      difficulty: "medium",
      minWordLength: 3,
    });
    const sub = submitPath(state, kitchenPath, dict);
    expect(sub.result).toMatchObject({ ok: true, word: "kitchen", points: 5 });
    expect(sub.state.found).toEqual(["kitchen"]);
  });

  it("accepts an 8-letter word on a supporting board", () => {
    const dict = createDictionary(["chainsaw", "chain"], ["chainsaw", "chain"]);
    const board = buildBoard(chainsawLetters, dict, 3, "square");
    expect(board.allWords).toContain("chainsaw");
    const state = createGame(board, {
      mode: "timed",
      duration: 60,
      difficulty: "medium",
      minWordLength: 3,
    });
    const sub = submitPath(state, chainsawPath, dict);
    expect(sub.result).toMatchObject({ ok: true, word: "chainsaw", points: 6 });
    expect(sub.state.found).toEqual(["chainsaw"]);
  });

  it("seeded gen boards can include words longer than 6", () => {
    const dict = createDictionary();
    const board = generateBoard({
      size: 5,
      dict,
      topology: "square",
      seed: 7,
    });
    // When findAllWords sees 7+, buildBoard/allWords must keep them (no 6-cap).
    const raw = findAllWords(board.letters, dict, "square");
    const long = raw.filter((w) => w.length > 6);
    for (const w of long) {
      expect(board.allWords).toContain(w);
    }
    // Seed 2 yields 7+ on 5×5 with the real ENABLE lexicon.
    const withLong = generateBoard({ size: 5, dict, topology: "square", seed: 2 });
    expect(withLong.allWords.some((w) => w.length >= 7)).toBe(true);
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

describe("missedOtherWords", () => {
  it("lists leftovers outside the long tease, skips 3-letter crumbs", () => {
    const board = buildBoard(
      [
        ["C", "A", "T"],
        ["S", "E", "A"],
        ["T", "X", "X"],
      ],
      miniDict,
      3,
      "square",
    );
    const state = createGame(board, {
      mode: "timed",
      duration: 60,
      difficulty: "medium",
      minWordLength: 3,
    });
    const long = missedLongWords(state, miniDict);
    const more = missedOtherWords(state, long);
    const leftover = new Set(board.allWords.filter((w) => !state.found.includes(w)));
    expect(long.every((w) => leftover.has(w))).toBe(true);
    expect(more.every((w) => leftover.has(w) && !long.includes(w) && w.length >= 4)).toBe(true);
    expect(more.every((w) => w.length >= 4)).toBe(true);
  });

  it("caps each length bucket so Results stays scannable", () => {
    const fours = Array.from({ length: 10 }, (_, i) => `w${String(i).padStart(3, "0")}`);
    const fives = Array.from({ length: 8 }, (_, i) => `x${String(i).padStart(4, "0")}`);
    const state = {
      board: {
        letters: [["A"]],
        size: 1 as const,
        topology: "square" as const,
        allWords: [...fours, ...fives, "cat"],
        maxScore: 0,
        targets: { easy: 0, medium: 0, hard: 0 },
      },
      config: {
        mode: "timed" as const,
        duration: 60 as const,
        difficulty: "medium" as const,
        minWordLength: 3 as const,
      },
      score: 0,
      found: [] as string[],
      target: null,
      remaining: null,
      remainingMs: 60_000,
      ended: null,
    };
    const more = missedOtherWords(state, [], MISSED_OTHER_PER_LENGTH);
    expect(more.filter((w) => w.length === 4)).toHaveLength(MISSED_OTHER_PER_LENGTH);
    expect(more.filter((w) => w.length === 5)).toHaveLength(MISSED_OTHER_PER_LENGTH);
    expect(more.some((w) => w.length === 3)).toBe(false);
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

  it("applies TARGET_RATIOS ladder (easy < medium < hard)", () => {
    // maxScore high enough that HARD_TARGET_FLOOR does not distort hard,
    // but still under TARGET_CAPS so ratios show through.
    const maxScore = 100;
    const t = computeTargets(maxScore);
    expect(t.easy).toBe(Math.ceil(maxScore * TARGET_RATIOS.easy));
    expect(t.medium).toBe(Math.ceil(maxScore * TARGET_RATIOS.medium));
    expect(t.hard).toBe(Math.ceil(maxScore * TARGET_RATIOS.hard));
    expect(t.easy).toBeLessThan(t.medium);
    expect(t.medium).toBeLessThan(t.hard);
    expect(t.hard).toBeLessThan(maxScore);
    // Short-first word ~p40/~p58/p80 → pts ≈ 0.25/0.40/0.65 (not raw max percentiles)
    expect(TARGET_RATIOS.easy).toBe(0.25);
    expect(TARGET_RATIOS.medium).toBe(0.4);
    expect(TARGET_RATIOS.hard).toBe(0.65);
    expect(TARGET_RATIOS.hard).toBeLessThan(0.75);
  });

  it("caps targets on crumb-dense boards so Goal pts stay casual", () => {
    const maxScore = 300; // typical fat 5×5 / 6×6 from short crumbs
    const t = computeTargets(maxScore);
    expect(t.easy).toBe(TARGET_CAPS.easy);
    expect(t.medium).toBe(TARGET_CAPS.medium);
    expect(t.hard).toBe(TARGET_CAPS.hard);
    expect(t.easy).toBeLessThan(t.medium);
    expect(t.medium).toBeLessThan(t.hard);
    // Uncapped ratio would be intimidating (e.g. med 120) — caps bite.
    expect(Math.ceil(maxScore * TARGET_RATIOS.medium)).toBeGreaterThan(TARGET_CAPS.medium);
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
  it("allWords is popular-only (ENABLE scraps stay out)", () => {
    // Board spells DETER (ENABLE, not popular) and CAT (popular).
    const letters = [
      ["D", "E", "T", "X"],
      ["R", "E", "C", "A"],
      ["X", "X", "X", "T"],
      ["X", "X", "X", "X"],
    ];
    const dict = createDictionary(["deter", "cat", "act", "tea"], ["cat", "act", "tea"]);
    const board = buildBoard(letters, dict, 3);
    expect(board.allWords).not.toContain("deter");
    expect(board.allWords).toContain("cat");
    expect(dict.has("deter")).toBe(false);
    expect(dict.enable.has("deter")).toBe(true);
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

  it("succeeds within retry cap on seeded RNG for every difficulty", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const rng = createSeededRng(42);
      const board = generateBoard({
        size: 4,
        dict: miniDict,
        topology: "square",
        difficulty,
        rng,
        retryCap: GEN_RETRY_CAP,
      });
      expect(board.letters).toHaveLength(4);
      expect(board.targets.hard).toBeLessThanOrEqual(board.maxScore);
    }
  });

  it("prefers ≥1 word of length ≥6 with the real lexicon when possible", () => {
    const dict = createDictionary();
    // Spot-check square + hex on 4×4 / 5×5 — ge6 floor + fallback ranking.
    for (const { size, topology, seed } of [
      { size: 4 as const, topology: "square" as const, seed: 1 },
      { size: 4 as const, topology: "hex" as const, seed: 2 },
      { size: 5 as const, topology: "square" as const, seed: 3 },
      { size: 5 as const, topology: "hex" as const, seed: 7 },
      { size: 4 as const, topology: "square" as const, seed: 42 },
    ]) {
      const board = generateBoard({ size, dict, topology, seed });
      expect(
        board.allWords.some((w) => w.length >= 6),
        `${topology} ${size}×${size} seed ${seed}`,
      ).toBe(true);
    }
  }, 30_000);

  it("asks larger grids for more long words while keeping a short-word base", () => {
    const dict = createDictionary();
    const cases = [
      { size: 5 as const, topology: "square" as const, seed: 11, minGe6: 5, minGe5: 12 },
      { size: 6 as const, topology: "square" as const, seed: 13, minGe6: 10, minGe5: 24 },
      { size: 5 as const, topology: "hex" as const, seed: 17, minGe6: 2, minGe5: 6 },
      { size: 6 as const, topology: "hex" as const, seed: 19, minGe6: 5, minGe5: 12 },
    ];
    for (const { size, topology, seed, minGe6, minGe5 } of cases) {
      const board = generateBoard({ size, dict, topology, seed });
      const ge5 = board.allWords.filter((w) => w.length >= 5).length;
      const ge6 = board.allWords.filter((w) => w.length >= 6).length;
      const ge3 = board.allWords.filter((w) => w.length >= 3).length;
      expect(ge6, `${topology} ${size} ge6`).toBeGreaterThanOrEqual(minGe6);
      expect(ge5, `${topology} ${size} ge5`).toBeGreaterThanOrEqual(minGe5);
      // Short crumbs still present (not a long-only board).
      expect(ge3, `${topology} ${size} ge3`).toBeGreaterThan(ge6);
    }
  }, 60_000);

  it("lands 8+ and often 10+ letter words on longer boards when possible", () => {
    const dict = createDictionary();
    // Soft ge10 on square 5/6 + hex 6 — may loosen; popular lexicon has fewer
    // 10+ paths than full ENABLE, so floors stay modest.
    for (const { size, topology, minSaw8, minSaw10 } of [
      { size: 5 as const, topology: "square" as const, minSaw8: 10, minSaw10: 2 },
      { size: 6 as const, topology: "square" as const, minSaw8: 18, minSaw10: 6 },
      { size: 6 as const, topology: "hex" as const, minSaw8: 6, minSaw10: 1 },
    ]) {
      let saw8 = 0;
      let saw10 = 0;
      const n = 24;
      for (let seed = 1; seed <= n; seed++) {
        const board = generateBoard({ size, dict, topology, seed });
        if (board.allWords.some((w) => w.length >= 8)) saw8++;
        if (board.allWords.some((w) => w.length >= 10)) saw10++;
      }
      expect(saw8, `${topology} ${size} 8+`).toBeGreaterThanOrEqual(minSaw8);
      expect(saw10, `${topology} ${size} 10+`).toBeGreaterThanOrEqual(minSaw10);
    }
  }, 120_000);

  it("falls back without a ≥6 word when the lexicon cannot provide one", () => {
    // miniDict max popular length is 4–5 — no path can yield a ≥6 word.
    const board = generateBoard({
      size: 4,
      dict: miniDict,
      seed: 99,
      retryCap: 20,
    });
    expect(board.letters).toHaveLength(4);
    expect(board.allWords.every((w) => w.length < 6)).toBe(true);
  });
});

describe("letter variety by difficulty", () => {
  it("flattens the common-letter bias more as difficulty rises (rare letters relatively boosted)", () => {
    const easy = letterMixWeights({}, "easy");
    const medium = letterMixWeights({}, "medium");
    const hard = letterMixWeights({}, "hard");
    // Ratio of a very common letter to a very rare one should shrink as difficulty rises,
    // since flattening compresses the dynamic range without reordering it.
    const ratio = (w: Record<string, number>) => w.e! / w.z!;
    expect(ratio(medium)).toBeLessThan(ratio(easy));
    expect(ratio(hard)).toBeLessThan(ratio(medium));
    // Still common-biased at every difficulty — never flips the ordering.
    expect(hard.e!).toBeGreaterThan(hard.z!);
  });

  it("boosts vowels on Easy relative to Medium (crumb-friendly boards)", () => {
    const easy = letterMixWeights({}, "easy");
    const medium = letterMixWeights({}, "medium");
    const vowelShare = (w: Record<string, number>) => {
      const vowels = w.a! + w.e! + w.i! + w.o! + w.u!;
      const all = Object.values(w).reduce((s, n) => s + n, 0);
      return vowels / all;
    };
    expect(vowelShare(easy)).toBeGreaterThan(vowelShare(medium));
    // Easy e vs a mid consonant should beat Medium's same ratio.
    expect(easy.e! / easy.t!).toBeGreaterThan(medium.e! / medium.t!);
  });

  it("docks a repeated letter's weight harder on higher difficulties", () => {
    const repeats = { e: 4 };
    const relativeDrop = (difficulty: "easy" | "medium" | "hard") =>
      letterMixWeights(repeats, difficulty).e! / letterMixWeights({}, difficulty).e!;
    expect(relativeDrop("medium")).toBeLessThan(relativeDrop("easy"));
    expect(relativeDrop("hard")).toBeLessThan(relativeDrop("medium"));
  });

  it("never zeroes out a letter (board stays generatable)", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const weights = letterMixWeights({ z: 20 }, difficulty);
      for (const w of Object.values(weights)) expect(w).toBeGreaterThan(0);
    }
  });

  it("generateBoard produces more distinct letters on hard than easy across seeded boards", () => {
    const dict = createDictionary();
    const distinctLetters = (letters: string[][]) => new Set(letters.flat()).size;
    let easySum = 0;
    let hardSum = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const easy = generateBoard({ size: 5, dict, difficulty: "easy", seed });
      const hard = generateBoard({ size: 5, dict, difficulty: "hard", seed });
      easySum += distinctLetters(easy.letters);
      hardSum += distinctLetters(hard.letters);
    }
    expect(hardSum).toBeGreaterThan(easySum);
  });

  it("Easy boards place more vowel tiles than Hard on the same seeds", () => {
    const dict = createDictionary();
    const vowels = new Set(["A", "E", "I", "O", "U"]);
    const vowelShare = (letters: string[][]) => {
      const flat = letters.flat();
      return flat.filter((c) => vowels.has(c)).length / flat.length;
    };
    let easyV = 0;
    let hardV = 0;
    for (const seed of [21, 22, 23, 24, 25]) {
      easyV += vowelShare(generateBoard({ size: 5, dict, difficulty: "easy", seed }).letters);
      hardV += vowelShare(generateBoard({ size: 5, dict, difficulty: "hard", seed }).letters);
    }
    expect(easyV).toBeGreaterThan(hardV);
  });

  it("Easy softens long-word gen floors while keeping ge3/ge4 and ge6≥1", () => {
    const base = BOARD_THRESHOLDS.square[5];
    const easy = thresholdsForDifficulty(base, "easy");
    expect(easy.ge3).toBe(base.ge3);
    expect(easy.ge4).toBe(base.ge4);
    expect(easy.ge5).toBeLessThan(base.ge5);
    expect(easy.ge6).toBeGreaterThanOrEqual(1);
    expect(easy.ge6).toBeLessThan(base.ge6);
    expect(easy.ge7).toBe(0);
    expect(easy.ge10).toBe(0);
    expect(thresholdsForDifficulty(base, "medium")).toEqual(base);
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
