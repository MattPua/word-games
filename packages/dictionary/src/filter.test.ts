import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyBlocklist,
  isValidWordToken,
  normalizeWord,
  parseWordList,
} from "./filter";
import { createDictionary } from "./index";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("dictionary filter", () => {
  it("normalizes and validates tokens", () => {
    expect(normalizeWord("  Cat ")).toBe("cat");
    expect(isValidWordToken("cat")).toBe(true);
    expect(isValidWordToken("to")).toBe(false);
    expect(isValidWordToken("hi!")).toBe(false);
  });

  it("applies blocklist", () => {
    const words = parseWordList("cat\nfuck\ndog\n");
    const out = applyBlocklist(words, new Set(["fuck"]));
    expect(out).toEqual(["cat", "dog"]);
  });

  it("filters known NSFW / offensive tokens", () => {
    const blocklist = new Set(
      parseWordList(readFileSync(join(root, "data/blocklist.txt"), "utf8")),
    );
    const nsfw = [
      "fuck",
      "cunt",
      "porn",
      "blowjob",
      "nigger",
      "pedophile",
      "dildo",
      "orgasm",
    ];
    for (const w of nsfw) {
      expect(blocklist.has(w), `blocklist missing ${w}`).toBe(true);
    }
    const kept = applyBlocklist(
      ["cat", "tree", ...nsfw, "potato"],
      blocklist,
    );
    expect(kept).toEqual(["cat", "tree", "potato"]);
  });

  it("built artifact excludes NSFW tokens", () => {
    const dict = createDictionary();
    for (const w of ["fuck", "cunt", "porn", "blowjob", "nigger"]) {
      expect(dict.has(w), `artifact still has ${w}`).toBe(false);
    }
    expect(dict.has("potato") || dict.has("cat")).toBe(true);
  });

  it("v1 accepts popular only — obscure enable1-only words rejected", () => {
    const dict = createDictionary();
    // enable1 Scrabble oddities that are not in dolph popular.txt
    expect(dict.enable.has("aalii")).toBe(true);
    expect(dict.isPopular("aalii")).toBe(false);
    expect(dict.has("aalii")).toBe(false);
    expect(dict.enable.has("aahed")).toBe(true);
    expect(dict.has("aahed")).toBe(false);
    expect(dict.has("potato")).toBe(true);
    expect(dict.has("cat")).toBe(true);
  });
});
