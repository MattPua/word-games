import enableArtifact from "./generated/words.json";

export type Dictionary = {
  /**
   * Full ENABLE − blocklist (kept for a future “full dictionary” mode).
   * v1 play does **not** accept or surface these unless also in `popular`.
   */
  enable: Set<string>;
  /**
   * Casual play lexicon: enable1 ∩ Wiktionary TV/movie frequency (dolph popular.txt),
   * minus blocklist. Primary set for accept, board allWords, targets, missed.
   */
  popular: Set<string>;
  /** v1: true only for popular (common) words. */
  has(word: string): boolean;
  isPopular(word: string): boolean;
};

let cached: Dictionary | null = null;

export function createDictionary(
  enableWords: string[] = enableArtifact.enable,
  popularWords: string[] = enableArtifact.popular,
): Dictionary {
  const enable = new Set(enableWords);
  const popular = new Set(popularWords);
  return {
    enable,
    popular,
    has: (word) => popular.has(word.toLowerCase()),
    isPopular: (word) => popular.has(word.toLowerCase()),
  };
}

/** Load once at app startup. */
export function getDictionary(): Dictionary {
  if (!cached) cached = createDictionary();
  return cached;
}

export { applyBlocklist, normalizeWord, parseWordList, isValidWordToken } from "./filter";
