/**
 * Lifetime pace stats for Potato Board (avg words/min + avg word length).
 * Authoritative math lives here; storage.ts persists; UI only formats.
 *
 * Time base (active play — Couch break pause excluded):
 * - Timed: sprint elapsed (`durationMs − remainingMs`)
 * - Survival: time lasted (`budgetMs − remainingMs`)
 * - Goal: wall-clock while unpaused
 *
 * Runs with no usable play time still update avg word length, but skip WPM.
 */

export type PaceStats = {
  /** Letters across accepted words (occurrences). */
  totalLetters: number;
  /** Words included in `totalLetters` (may lag `Profile.wordsFound` on old profiles). */
  lengthWords: number;
  /** Active play seconds counted toward WPM. */
  playSeconds: number;
  /** Words included in WPM (only runs with known active play time). */
  wpmWords: number;
};

export type PaceHaul = {
  words: string[];
  /** Active play this run, ms. ≤0 / missing → length only, no WPM credit. */
  activePlayMs?: number;
};

export function defaultPaceStats(): PaceStats {
  return { totalLetters: 0, lengthWords: 0, playSeconds: 0, wpmWords: 0 };
}

export function normalizePaceStats(raw: Partial<PaceStats> | undefined): PaceStats {
  const d = defaultPaceStats();
  if (!raw || typeof raw !== "object") return d;
  return {
    totalLetters: Math.max(0, Math.floor(Number(raw.totalLetters) || 0)),
    lengthWords: Math.max(0, Math.floor(Number(raw.lengthWords) || 0)),
    playSeconds: Math.max(0, Number(raw.playSeconds) || 0),
    wpmWords: Math.max(0, Math.floor(Number(raw.wpmWords) || 0)),
  };
}

/** Seed WPM totals from recent Timed runs when pace fields were missing. */
export function seedPaceFromTimedHistory(
  history: readonly { mode: string; wordsFound: number; duration?: number }[],
): Pick<PaceStats, "playSeconds" | "wpmWords"> {
  let playSeconds = 0;
  let wpmWords = 0;
  for (const h of history) {
    if (h.mode !== "timed") continue;
    const dur = h.duration;
    if (dur == null || dur <= 0) continue;
    const words = Math.max(0, Math.floor(h.wordsFound) || 0);
    playSeconds += dur;
    wpmWords += words;
  }
  return { playSeconds, wpmWords };
}

export function applyRunToPaceStats(stats: PaceStats, haul: PaceHaul): PaceStats {
  let totalLetters = stats.totalLetters;
  let lengthWords = stats.lengthWords;
  let accepted = 0;
  for (const raw of haul.words) {
    const len = raw.length;
    if (len <= 0) continue;
    totalLetters += len;
    lengthWords += 1;
    accepted += 1;
  }

  let playSeconds = stats.playSeconds;
  let wpmWords = stats.wpmWords;
  const ms = haul.activePlayMs ?? 0;
  if (ms > 0 && accepted > 0) {
    playSeconds += ms / 1000;
    wpmWords += accepted;
  }

  return { totalLetters, lengthWords, playSeconds, wpmWords };
}

/** Avg letters per accepted word, or null when no lettered words yet. */
export function avgWordLength(stats: PaceStats): number | null {
  if (stats.lengthWords <= 0) return null;
  return stats.totalLetters / stats.lengthWords;
}

/** Lifetime words per minute from active play, or null when no timed play yet. */
export function avgWpm(stats: PaceStats): number | null {
  if (stats.playSeconds <= 0 || stats.wpmWords <= 0) return null;
  return (stats.wpmWords * 60) / stats.playSeconds;
}

/** One decimal for Potato Board readouts; null → em dash. */
export function formatPaceStat(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return (Math.round(value * 10) / 10).toFixed(1);
}
