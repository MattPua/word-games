import enableArtifact from "./generated/enable.json";
import popularArtifact from "./generated/popular.json";
import { applyBlocklist, mergeBlocklists } from "./filter";

export type Dictionary = {
  /**
   * Full ENABLE − blocklist. Kept for a future “dictionary mode”; **not** the
   * v1 play accept set (too many Scrabble scraps: leu, mut, thro, …).
   */
  enable: Set<string>;
  /**
   * Casual play lexicon: ENABLE ∩ wordfreq zipf gate ∪ play-allowlist
   * (− NSFW − names). **v1 accept** — board `allWords`, targets, Words left.
   */
  popular: Set<string>;
  /** Play accept: true for popular − blocklist. */
  has(word: string): boolean;
  /** Alias of `has` for gen ranking / Long ones left (same set in v1). */
  isPopular(word: string): boolean;
};

let cached: Dictionary | null = null;

export function createDictionary(
  enableWords: string[] = enableArtifact as string[],
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

/** Load once — popular play lexicon (+ ENABLE set kept for future dictionary mode). */
export function getDictionary(): Dictionary {
  if (!cached) cached = createDictionary();
  return cached;
}

/**
 * Fresh Dictionary with extra tokens removed from enable + popular.
 * Use for per-run house bans — never mutate the `getDictionary()` singleton.
 */
export function dictionaryWithoutWords(
  base: Dictionary,
  extraBlocked: Iterable<string>,
): Dictionary {
  const block = mergeBlocklists(extraBlocked);
  if (block.size === 0) return base;
  return createDictionary(applyBlocklist(base.enable, block), applyBlocklist(base.popular, block));
}

/**
 * Prefetch helper for a future ENABLE “dictionary mode” — not the v1 play path.
 * Play warms via `getDictionary()` / dynamic `@couch-potato/dictionary` import.
 */
export async function loadEnableWords(): Promise<string[]> {
  const mod = await import("./generated/enable.json");
  return mod.default as string[];
}

export {
  applyBlocklist,
  buildNameBlocklist,
  mergeBlocklists,
  normalizeWord,
  parseBabyNameMass,
  parseWordList,
  isValidWordToken,
} from "./filter";
