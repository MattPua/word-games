import { play } from "cuelume";

/**
 * Full-board clear: every solvable word found (`found.length === allWords.length`).
 * Bigger than a long-word accept — sparkle → bloom → ready.
 * Distinct from target win (remaining → 0), which may fire earlier or not at all (timed).
 */
export function playBoardClearedSound(): void {
  play("sparkle");
  window.setTimeout(() => play("bloom"), 160);
  window.setTimeout(() => play("ready"), 380);
}
