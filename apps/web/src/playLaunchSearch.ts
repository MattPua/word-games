/**
 * Shareable `/play` search params ↔ lobby `PlayLaunch`.
 *
 * Examples:
 *   /play?mode=goal&grid=5&board=hex&diff=hard&min=4
 *   /play?mode=timed&grid=4&board=square&time=90&min=3
 *   /play?mode=survival&grid=6&board=hex&diff=easy&min=3
 *
 * `mode=goal` is the share spelling for engine `target` (lobby card name).
 * `board=honeycomb` aliases `hex`. Bare `/play` falls back to last launch.
 */
import {
  loadLaunch,
  normalizePlayLaunch,
  type PlayLaunch,
} from "./storage";

/** Canonical shareable search (always fully filled after validateSearch). */
export type PlaySearch = {
  mode: "goal" | "timed" | "survival";
  grid: 4 | 5 | 6;
  board: "square" | "hex";
  min: 3 | 4 | 5;
  /** Goal / Survival */
  diff?: "easy" | "medium" | "hard";
  /** Timed seconds */
  time?: 30 | 60 | 90 | 120;
};

const SEARCH_KEYS = ["mode", "grid", "board", "min", "diff", "time"] as const;

export function hasExplicitPlaySearch(search: Record<string, unknown>): boolean {
  return SEARCH_KEYS.some((k) => {
    const v = search[k];
    return v != null && v !== "";
  });
}

function asInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}

/** Build a PlayLaunch from raw / validated search (unknown keys ignored). */
export function playLaunchFromSearch(search: Record<string, unknown>): PlayLaunch {
  const modeRaw = typeof search.mode === "string" ? search.mode.toLowerCase() : "";
  const mode =
    modeRaw === "timed" || modeRaw === "survival"
      ? modeRaw
      : modeRaw === "goal" || modeRaw === "target"
        ? "target"
        : undefined;

  const gridN = asInt(search.grid);
  const grid = gridN === 4 || gridN === 5 || gridN === 6 ? gridN : undefined;

  const boardRaw = typeof search.board === "string" ? search.board.toLowerCase() : "";
  const topology =
    boardRaw === "hex" || boardRaw === "honeycomb"
      ? "hex"
      : boardRaw === "square"
        ? "square"
        : undefined;

  const minN = asInt(search.min);
  const minWordLength = minN === 3 || minN === 4 || minN === 5 ? minN : undefined;

  const diffRaw = typeof search.diff === "string" ? search.diff.toLowerCase() : "";
  const difficulty =
    diffRaw === "easy" || diffRaw === "medium" || diffRaw === "hard" ? diffRaw : undefined;

  const timeN = asInt(search.time);
  const duration =
    timeN === 30 || timeN === 60 || timeN === 90 || timeN === 120 ? timeN : undefined;

  return normalizePlayLaunch({
    mode,
    grid,
    topology,
    minWordLength,
    difficulty,
    duration,
  });
}

/** Full shareable search object from a launch (player-facing `goal`, not `target`). */
export function playSearchFromLaunch(launch: PlayLaunch): PlaySearch {
  const n = normalizePlayLaunch(launch);
  const base = {
    mode: (n.mode === "target" ? "goal" : n.mode) as PlaySearch["mode"],
    grid: n.grid,
    board: (n.topology ?? "square") as PlaySearch["board"],
    min: (n.minWordLength ?? 3) as PlaySearch["min"],
  };
  if (n.mode === "timed") {
    return { ...base, time: (n.duration ?? 60) as PlaySearch["time"] };
  }
  return { ...base, diff: (n.difficulty ?? "easy") as NonNullable<PlaySearch["diff"]> };
}

/**
 * Route `validateSearch`: explicit params win; bare `/play` restores last launch
 * so Restart / cold open stay consistent, then the address bar can show the prefs.
 */
export function validatePlaySearch(raw: Record<string, unknown>): PlaySearch {
  if (!hasExplicitPlaySearch(raw)) {
    return playSearchFromLaunch(loadLaunch());
  }
  return playSearchFromLaunch(playLaunchFromSearch(raw));
}
