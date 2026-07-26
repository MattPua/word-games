import type { Dictionary } from "@couch-potato/dictionary";
import { MIN_WORD_LENGTH } from "./config";
import type { Cell } from "./path";
import { neighborDeltas, type GridTopology } from "./topology";

type TrieNode = {
  children: Map<string, TrieNode>;
  end: boolean;
};

function buildTrie(words: Iterable<string>): TrieNode {
  const root: TrieNode = { children: new Map(), end: false };
  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH) continue;
    let node = root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map(), end: false };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.end = true;
  }
  return root;
}

/**
 * Find all unique playable (popular) words on the board (topology neighbors, no reuse).
 * No max length — DFS walks until tiles run out or the trie has no child (up to size²).
 */
export function findAllWords(
  letters: string[][],
  dict: Dictionary,
  topology: GridTopology = "square",
): string[] {
  const size = letters.length;
  const trie = buildTrie(dict.popular);
  const found = new Set<string>();
  const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  function dfs(row: number, col: number, node: TrieNode, prefix: string) {
    const ch = letters[row]![col]!.toLowerCase();
    const next = node.children.get(ch);
    if (!next) return;
    const word = prefix + ch;
    visited[row]![col] = true;
    if (next.end && word.length >= MIN_WORD_LENGTH) found.add(word);
    for (const d of neighborDeltas(topology, row)) {
      const nr = row + d.row;
      const nc = col + d.col;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      if (visited[nr]![nc]) continue;
      dfs(nr, nc, next, word);
    }
    visited[row]![col] = false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      dfs(r, c, trie, "");
    }
  }
  return [...found];
}

/**
 * First adjacent no-reuse path that spells `word` (case-insensitive).
 * Used by Results to paint a haul/missed word on the replay board — any valid
 * path is fine when several exist (same rule as accept: one swipe, one path).
 */
export function findPathForWord(
  letters: string[][],
  word: string,
  topology: GridTopology = "square",
): Cell[] | null {
  const target = word.toLowerCase();
  if (target.length === 0) return null;
  const size = letters.length;
  if (size === 0) return null;
  const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const path: Cell[] = [];

  function dfs(row: number, col: number, i: number): boolean {
    if (letters[row]![col]!.toLowerCase() !== target[i]) return false;
    path.push({ row, col });
    if (i === target.length - 1) return true;
    visited[row]![col] = true;
    for (const d of neighborDeltas(topology, row)) {
      const nr = row + d.row;
      const nc = col + d.col;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      if (visited[nr]![nc]) continue;
      if (dfs(nr, nc, i + 1)) return true;
    }
    visited[row]![col] = false;
    path.pop();
    return false;
  }

  const first = target[0]!;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (letters[r]![c]!.toLowerCase() !== first) continue;
      if (dfs(r, c, 0)) return path.map((cell) => ({ ...cell }));
      path.length = 0;
      for (let vr = 0; vr < size; vr++) visited[vr]!.fill(false);
    }
  }
  return null;
}
