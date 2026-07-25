import enableArtifact from "./generated/words.json";

export type Dictionary = {
  /** Full validation set (enable1 − blocklist). */
  enable: Set<string>;
  /** Common words for board bias + missed ranking. */
  popular: Set<string>;
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
    has: (word) => enable.has(word.toLowerCase()),
    isPopular: (word) => popular.has(word.toLowerCase()),
  };
}

/** Load once at app startup. */
export function getDictionary(): Dictionary {
  if (!cached) cached = createDictionary();
  return cached;
}

export { applyBlocklist, normalizeWord, parseWordList, isValidWordToken } from "./filter";
