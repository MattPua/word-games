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

/** Compact HUD chip: difficulty for Goal/Survival, duration for Timed. */
export function formatRunChallengeBadge(run: RunMetaInput): string {
  if (run.mode === "timed") return `${run.duration ?? 60}s`;
  return formatDifficulty(run.difficulty ?? "easy");
}

/** Results line under the haul: mode · challenge · min length. */
export function formatRunMeta(run: RunMetaInput): string {
  const min = `${run.minWordLength ?? 3}+`;
  if (run.mode === "timed") return `Timed · ${run.duration ?? 60}s · ${min}`;
  if (run.mode === "survival") {
    return `Survival · ${formatDifficulty(run.difficulty ?? "easy")} · ${min}`;
  }
  return `Goal · ${formatDifficulty(run.difficulty ?? "easy")} · ${min}`;
}
