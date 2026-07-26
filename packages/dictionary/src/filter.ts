/** Normalize + filter word lists with blocklist / proper-noun pass. */
export function normalizeWord(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidWordToken(word: string): boolean {
  return /^[a-z]+$/.test(word) && word.length >= 3;
}

export function applyBlocklist(words: Iterable<string>, blocklist: Set<string>): string[] {
  const out: string[] = [];
  for (const raw of words) {
    const w = normalizeWord(raw);
    if (!isValidWordToken(w)) continue;
    if (blocklist.has(w)) continue;
    out.push(w);
  }
  return out;
}

export function parseWordList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(normalizeWord)
    .filter((w) => w.length > 0 && !w.startsWith("#"));
}

/**
 * Parse Hadley/SSA-style baby-names.csv (`year,"Name",percent,"sex"`).
 * Returns names whose cumulative percent mass clears `minMass` (filters noise).
 */
export function parseBabyNameMass(
  csv: string,
  minMass = 0.05,
): Map<string, number> {
  const mass = new Map<string, number>();
  for (const line of csv.split(/\r?\n/)) {
    const m = line.match(/^\d+,"([^"]+)",([0-9.]+),"(?:boy|girl)"$/i);
    if (!m) continue;
    const name = normalizeWord(m[1]!);
    if (!isValidWordToken(name)) continue;
    mass.set(name, (mass.get(name) ?? 0) + Number(m[2]));
  }
  for (const [name, total] of mass) {
    if (total < minMass) mass.delete(name);
  }
  return mass;
}

/**
 * Given-name block set: baby-name mass minus dual-use allowlist.
 * Obscure Scrabble senses of names do not save them — allowlist is everyday English only.
 */
export function buildNameBlocklist(
  babyNamesCsv: string,
  allowlist: Iterable<string>,
  minMass = 0.05,
): Set<string> {
  const allow = new Set(
    [...allowlist].map(normalizeWord).filter((w) => isValidWordToken(w)),
  );
  const out = new Set<string>();
  for (const name of parseBabyNameMass(babyNamesCsv, minMass).keys()) {
    if (!allow.has(name)) out.add(name);
  }
  return out;
}

export function mergeBlocklists(...lists: Iterable<string>[]): Set<string> {
  const out = new Set<string>();
  for (const list of lists) {
    for (const raw of list) {
      const w = normalizeWord(raw);
      if (isValidWordToken(w)) out.add(w);
    }
  }
  return out;
}
