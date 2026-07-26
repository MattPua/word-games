import popularArtifact from "./generated/popular.json";

export type Dictionary = {
  /**
   * Full ENABLE − blocklist (kept for a future “full dictionary” mode).
   * v1 play does **not** accept or surface these unless also in `popular`.
   * Default client load leaves this empty; pass `enableWords` or call
   * `loadEnableWords()` when you need the full set.
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
  enableWords: string[] = [],
  popularWords: string[] = popularArtifact as string[],
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

/** Load once — popular-only (v1 play). Does not pull the full enable list into the bundle. */
export function getDictionary(): Dictionary {
  if (!cached) cached = createDictionary();
  return cached;
}

/** Async full ENABLE list for future dictionary mode — dynamic import, not on lobby cold path. */
export async function loadEnableWords(): Promise<string[]> {
  const mod = await import("./generated/enable.json");
  return mod.default as string[];
}

export { applyBlocklist, normalizeWord, parseWordList, isValidWordToken } from "./filter";
