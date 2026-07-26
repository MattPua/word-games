import { describe, expect, it } from "vitest";
import { CUSTOM_BLOCK_CAP, normalizeCustomBlockedWords } from "./storage";

describe("normalizeCustomBlockedWords", () => {
  it("lowercases, dedupes, drops junk/short, and caps", () => {
    expect(
      normalizeCustomBlockedWords(["Cat", "cat", "DOG", "ab", "hi!", "  bird  ", 12]),
    ).toEqual(["cat", "dog", "bird"]);
  });

  it("enforces the soft cap", () => {
    const many = Array.from({ length: CUSTOM_BLOCK_CAP + 5 }, (_, i) => {
      const n = i + 1;
      // letter-only tokens (normalize rejects digits)
      return `ban${"abcdefghijklmnopqrstuvwxyz"[n % 26]}${"abcdefghijklmnopqrstuvwxyz"[Math.floor(n / 26) % 26]}xx`;
    });
    expect(normalizeCustomBlockedWords(many)).toHaveLength(CUSTOM_BLOCK_CAP);
  });
});
