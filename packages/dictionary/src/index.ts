import enableArtifact from "./generated/enable.json";
import popularArtifact from "./generated/popular.json";
import { applyBlocklist, mergeBlocklists } from "./filter";

export type Dictionary = {
  /**
   * Full ENABLE − blocklist. Play lexicon for accept, board `allWords`,
   * targets, and Words left.
   */
  enable: Set<string>;
  /**
   * Casual common-word subset (enable1 ∩ Wiktionary TV/movie frequency).
   * Used for gen quality ranking + Results “Long ones left” tease — not accept.
   */
  popular: Set<string>;
  /** Play accept: true for ENABLE − blocklist. */
  has(word: string): boolean;
  /** True for the common popular subset only. */
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
    has: (word) => enable.has(word.toLowerCase()),
    isPopular: (word) => popular.has(word.toLowerCase()),
  };
}

/** Load once — ENABLE play lexicon (+ popular for quality/tease signals). */
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

/** Prefetch helper — same artifact `getDictionary` uses; warms the play chunk. */
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
