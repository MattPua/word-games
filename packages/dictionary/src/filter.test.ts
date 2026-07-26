import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyBlocklist,
  buildNameBlocklist,
  isValidWordToken,
  mergeBlocklists,
  normalizeWord,
  parseBabyNameMass,
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
    const nsfw = ["fuck", "cunt", "porn", "blowjob", "nigger", "pedophile", "dildo", "orgasm"];
    for (const w of nsfw) {
      expect(blocklist.has(w), `blocklist missing ${w}`).toBe(true);
    }
    const kept = applyBlocklist(["cat", "tree", ...nsfw, "potato"], blocklist);
    expect(kept).toEqual(["cat", "tree", "potato"]);
  });

  it("built artifact excludes NSFW tokens", () => {
    const dict = createDictionary();
    for (const w of ["fuck", "cunt", "porn", "blowjob", "nigger"]) {
      expect(dict.has(w), `artifact still has ${w}`).toBe(false);
    }
    expect(dict.has("potato") || dict.has("cat")).toBe(true);
  });

  it("play accepts popular only (rejects ENABLE Scrabble scraps)", () => {
    const dict = createDictionary();
    // ENABLE-only scraps that snuck in when play = full ENABLE
    expect(dict.has("leu")).toBe(false);
    expect(dict.has("mut")).toBe(false);
    expect(dict.has("thro")).toBe(false);
    expect(dict.has("aalii")).toBe(false);
    expect(dict.enable.has("leu")).toBe(true);
    // Everyday words stay
    expect(dict.has("potato")).toBe(true);
    expect(dict.isPopular("potato")).toBe(true);
    expect(dict.has("cat")).toBe(true);
    // Legitimate ENABLE that miss the popular cut — not playable in v1
    expect(dict.enable.has("deter")).toBe(true);
    expect(dict.has("deter")).toBe(false);
    expect(dict.isPopular("deter")).toBe(false);
  });

  it("buildNameBlocklist drops given names but keeps dual-use allowlist", () => {
    const csv = [
      '1880,"John",0.08,"boy"',
      '1880,"Peter",0.06,"boy"',
      '1880,"Mark",0.05,"boy"',
      '1880,"Grace",0.05,"girl"',
      '1880,"Zorp",0.001,"boy"', // below mass floor
    ].join("\n");
    const block = buildNameBlocklist(csv, ["mark", "grace"], 0.05);
    expect(block.has("john")).toBe(true);
    expect(block.has("peter")).toBe(true);
    expect(block.has("mark")).toBe(false);
    expect(block.has("grace")).toBe(false);
    expect(block.has("zorp")).toBe(false);
    expect(parseBabyNameMass(csv, 0.05).has("peter")).toBe(true);
  });

  it("mergeBlocklists unions NSFW + names", () => {
    const merged = mergeBlocklists(["fuck"], ["peter", "JOHN"]);
    expect(merged.has("fuck")).toBe(true);
    expect(merged.has("peter")).toBe(true);
    expect(merged.has("john")).toBe(true);
  });

  it("built artifact rejects common given names, keeps dual-use English", () => {
    const dict = createDictionary();
    for (const name of ["peter", "john", "james", "jennifer", "michael", "sarah"]) {
      expect(dict.has(name), `name still playable: ${name}`).toBe(false);
    }
    for (const word of ["mark", "hope", "grace", "will", "heather", "rose", "potato"]) {
      expect(dict.has(word), `dual-use/English missing: ${word}`).toBe(true);
    }
  });
});
