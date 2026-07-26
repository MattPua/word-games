import { play } from "cuelume";

export type RunEndReason = "won" | "timeout" | "quit";
export type RunEndMode = "target" | "timed" | "survival";

/** Play HUD ScoreBubble line during the end-run tile-drop beat. */
export function runEndPill(reason: RunEndReason, mode: RunEndMode): string {
  if (reason === "won") return "Couch clear!";
  if (reason === "timeout") return mode === "survival" ? "Clock ran dry!" : "Time's up!";
  return "That's a wrap!";
}

/**
 * Curtain-call SFX before Results. Win keeps the fanfare; timeout/quit get a
 * shorter sparkle→ready / bloom→tick so every finish feels like a beat.
 */
export function playRunEndSound(
  reason: RunEndReason,
  options: { boardAlreadyCleared?: boolean } = {},
): void {
  if (reason === "won") {
    if (!options.boardAlreadyCleared) {
      play("bloom");
      window.setTimeout(() => play("sparkle"), 180);
    }
    return;
  }
  if (reason === "timeout") {
    play("sparkle");
    window.setTimeout(() => play("ready"), 200);
    return;
  }
  play("bloom");
  window.setTimeout(() => play("tick"), 160);
}
