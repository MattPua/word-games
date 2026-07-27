/**
 * Path-select notes while swiping — C major do re mi fa so la ti do…
 * Equal temperament from C5 so the melody reads clearly on phone speakers.
 */

import { playScaleNote } from "./sfx";

/**
 * C major scale degrees (A440 ET), starting at C5 = do.
 * Index wraps into higher octaves for long paths.
 */
const C_MAJOR_HZ = [
  523.25, // do  C5
  587.33, // re  D5
  659.25, // mi  E5
  698.46, // fa  F5
  783.99, // so  G5
  880.0, // la  A5
  987.77, // ti  B5
] as const;

/** Soft ceiling — C7; keeps 10+ swipes from going piercing. */
const MAX_HZ = 2093.0;

/** Hz for 0-based step (0 = do / C, 1 = re / D, …). */
export function pathSelectFrequency(step: number): number {
  const i = Math.max(0, Math.floor(step));
  const octave = Math.floor(i / 7);
  const degree = i % 7;
  const hz = C_MAJOR_HZ[degree]! * 2 ** octave;
  return Math.min(hz, MAX_HZ);
}

/**
 * Play the C major scale degree for a newly added tile.
 * `step` = path length − 1 (first tile = 0 / do).
 */
export function playPathSelectTone(step: number): void {
  // Even-ish level so the do–re–mi climb stays obvious (only soft taper late).
  const peak = Math.max(0.045, 0.075 * (1 - Math.min(step, 16) * 0.02));
  playScaleNote(pathSelectFrequency(step), peak);
}

/**
 * Chirp on grow **and** backtrack.
 * Grow → note for the new tip; shrink → note for the tip you land on (scale steps down).
 * Silent on full clear (length 0).
 */
export function pathSelectOnChange(nextLen: number, prevLen: number): void {
  if (nextLen === prevLen) return;
  if (nextLen === 0) return;
  // Tip after the change (grow or backtrack).
  playPathSelectTone(nextLen - 1);
}
