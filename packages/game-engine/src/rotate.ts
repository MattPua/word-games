import type { Board } from "./generate";
import type { GridTopology } from "./topology";

/**
 * One natural lattice-preserving rotate of the letter matrix.
 * - square: 90° CW — `(r,c) → (c, n-1-r)`
 * - hex (odd-r rect): 180° — `(r,c) → (n-1-r, n-1-c)` (90° would break offset adjacency)
 * Glyphs stay upright; only cell positions move.
 */
export function rotateLettersCW(
  letters: string[][],
  topology: GridTopology = "square",
): string[][] {
  const n = letters.length;
  if (topology === "hex") {
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => letters[n - 1 - r]![n - 1 - c]!),
    );
  }
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => letters[n - 1 - c]![r]!),
  );
}

/** Apply `steps` natural rotates (square mod 4, hex mod 2). Letters only — scores/words unchanged until regen. */
export function rotateBoard(board: Board, steps = 1): Board {
  const mod = board.topology === "hex" ? 2 : 4;
  const n = ((steps % mod) + mod) % mod;
  let letters = board.letters;
  for (let i = 0; i < n; i++) {
    letters = rotateLettersCW(letters, board.topology);
  }
  return { ...board, letters };
}
