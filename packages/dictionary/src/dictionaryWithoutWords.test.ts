import { describe, expect, it } from "vitest";
import { createDictionary, dictionaryWithoutWords } from "./index";

describe("dictionaryWithoutWords", () => {
  it("returns the same instance when the extra block is empty", () => {
    const base = createDictionary(["cat", "dog", "bird"], ["cat", "dog"]);
    expect(dictionaryWithoutWords(base, [])).toBe(base);
  });

  it("strips tokens from enable and popular without mutating the base", () => {
    const base = createDictionary(["cat", "dog", "bird"], ["cat", "dog"]);
    const next = dictionaryWithoutWords(base, ["DOG", "zzz"]);
    expect(next.has("dog")).toBe(false);
    expect(next.has("cat")).toBe(true);
    expect(next.isPopular("dog")).toBe(false);
    expect(next.isPopular("cat")).toBe(true);
    expect(base.has("dog")).toBe(true);
  });
});
