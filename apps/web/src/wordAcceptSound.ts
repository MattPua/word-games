import { play } from "cuelume";

/**
 * Escalating cuelume celebration by accepted word length.
 * Keep thresholds here — don’t scatter length magic numbers at call sites.
 *
 * Ladder stays in the ascending sine-arp family (`success` / `sparkle` share
 * an A-major shape) so each step feels like “more of the same, louder joy” —
 * never the lone `bloom` pad as a mid-tier (that read as random vs 3 / 5).
 *
 * | Length | Sound |
 * |--------|--------|
 * | 3      | `success` (first word: `sparkle`) |
 * | 4      | `sparkle` |
 * | 5      | `sparkle` + delayed `tick` |
 * | 6+     | `sparkle` + delayed `bloom` afterglow |
 */
export function playAcceptedWordSound(length: number, options: { firstWord?: boolean } = {}): void {
  const { firstWord = false } = options;

  if (length >= 6) {
    play("sparkle");
    window.setTimeout(() => play("bloom"), 160);
    return;
  }

  if (length >= 5) {
    play("sparkle");
    window.setTimeout(() => play("tick"), 140);
    return;
  }

  if (length >= 4) {
    play("sparkle");
    return;
  }

  play(firstWord ? "sparkle" : "success");
}
