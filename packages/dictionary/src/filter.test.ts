import { describe, expect, it } from "vitest";
import {
  applyBlocklist,
  isValidWordToken,
  normalizeWord,
  parseWordList,
} from "./filter";

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
});
