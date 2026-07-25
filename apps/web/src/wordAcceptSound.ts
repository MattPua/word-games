import { play } from "cuelume";

/**
 * Escalating cuelume celebration by accepted word length.
 * Keep thresholds here — don’t scatter length magic numbers at call sites.
 *
 * | Length | Sound |
 * |--------|--------|
 * | 3      | `success` (first word: `sparkle`) |
 * | 4–5    | `bloom` (first word: `sparkle`) |
 * | 6+     | `sparkle` + delayed `tick` |
 */
export function playAcceptedWordSound(
  length: number,
  options: { firstWord?: boolean } = {},
): void {
  const { firstWord = false } = options;

  if (length >= 6) {
    play("sparkle");
    window.setTimeout(() => play("tick"), 140);
    return;
  }

  if (length >= 4) {
    play(firstWord ? "sparkle" : "bloom");
    return;
  }

  play(firstWord ? "sparkle" : "success");
}
