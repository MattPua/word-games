/** Word-list ordering: longest first, then A→Z within a length. */

export function compareWordsByLengthThenAlpha(a: string, b: string): number {
  return b.length - a.length || a.localeCompare(b);
}

export function sortWordsByLengthThenAlpha(words: Iterable<string>): string[] {
  return [...words].sort(compareWordsByLengthThenAlpha);
}

export type WordLengthGroup = {
  length: number;
  words: string[];
};

/** Group by length (longest groups first); each group sorted A→Z. */
export function groupWordsByLength(words: Iterable<string>): WordLengthGroup[] {
  const byLen = new Map<number, string[]>();
  for (const w of words) {
    const list = byLen.get(w.length);
    if (list) list.push(w);
    else byLen.set(w.length, [w]);
  }
  return [...byLen.keys()]
    .sort((a, b) => b - a)
    .map((length) => ({
      length,
      words: (byLen.get(length) ?? []).sort((a, b) => a.localeCompare(b)),
    }));
}
