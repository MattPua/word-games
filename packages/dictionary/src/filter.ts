/** Normalize + filter word lists with blocklist. */
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
