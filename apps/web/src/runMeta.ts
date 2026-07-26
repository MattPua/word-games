/** Shared Goal / Timed / Survival run labels — Play badge + Results meta. */

export type RunMetaInput = {
  mode: "target" | "timed" | "survival";
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
  minWordLength?: 3 | 4 | 5;
};

export function formatDifficulty(d: "easy" | "medium" | "hard"): string {
  return d === "easy" ? "Easy" : d === "medium" ? "Medium" : "Hard";
}

export function formatModeLabel(mode: RunMetaInput["mode"]): string {
  if (mode === "timed") return "Timed";
  if (mode === "survival") return "Survival";
  return "Goal";
}

/** Compact HUD chip: Easy / Medium / Hard for every mode (Timed duration lives on the ring). */
export function formatRunChallengeBadge(run: RunMetaInput): string {
  return formatDifficulty(run.difficulty ?? "easy");
}

/** Single-line aria / history: mode · challenge · (duration) · min length. */
export function formatRunMeta(run: RunMetaInput): string {
  const min = `${run.minWordLength ?? 3}+`;
  const diff = formatDifficulty(run.difficulty ?? "easy");
  if (run.mode === "timed") return `Timed · ${diff} · ${run.duration ?? 60}s · ${min}`;
  if (run.mode === "survival") return `Survival · ${diff} · ${min}`;
  return `Goal · ${diff} · ${min}`;
}

/** Goal stopwatch HUD — always `m:ss` (counts up while unpaused). */
export function formatElapsedClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
