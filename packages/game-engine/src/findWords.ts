import type { Dictionary } from "@couch-potato/dictionary";
import { MIN_WORD_LENGTH } from "./config";
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

/** Find all unique *playable* (popular) words on the board (topology neighbors, no reuse). */
export function findAllWords(
  letters: string[][],
  dict: Dictionary,
  topology: GridTopology = "square",
): string[] {
  const size = letters.length;
  // Casual play: only popular — obscure enable1-only words never drive targets/missed.
  const trie = buildTrie(dict.popular);
  const found = new Set<string>();
  const visited = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

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
