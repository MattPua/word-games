import { play } from "./sfx";

/** Soft settle when Couch break opens — respects global mute via `setEnabled`. */
export function playPauseSound(): void {
  play("pause");
}

/** Soft wake when Couch break closes via Resume / Escape — not End run / Restart. */
export function playResumeSound(): void {
  play("resume");
}
