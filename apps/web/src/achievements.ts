/**
 * Local per-profile achievement progression — "Couch medals". Authoritative
 * math lives here only; UI (results peek, achievements page) just renders
 * `TrackProgress` / `StageUp` values, never recomputes milestone logic.
 *
 * Tracks are deliberately decoupled from `@couch-potato/game-engine`'s
 * `GameMode` union: `RunHaul.mode` is a plain string so a future mode (e.g.
 * "survival") flows through without a change here. Survival-specific counts
 * (`survivalBestMs`, `survivalWordsFound`) are already modeled below as an
 * extension point — wire `durationSurvivedMs` from that mode's results once
 * it ships (see `RunHaul`).
 */

export type LengthBucket = "3" | "4" | "5" | "6" | "7plus";

export const LENGTH_BUCKETS: readonly LengthBucket[] = ["3", "4", "5", "6", "7plus"];

export function lengthBucket(len: number): LengthBucket {
  if (len >= 7) return "7plus";
  if (len <= 3) return "3";
  return String(len) as LengthBucket;
}

export type AchievementCounts = {
  /** Cumulative points earned across every run, ever. */
  totalPoints: number;
  /** Unique words ever found, case-normalized (lowercase). */
  uniqueWords: string[];
  /** Total word finds by length bucket (not deduped — repeats across runs count). */
  lengthCounts: Record<LengthBucket, number>;
  /** Best single-run survival time, ms. 0 until Survival ships / is played. */
  survivalBestMs: number;
  /** Words found while in Survival mode, cumulative. */
  survivalWordsFound: number;
  /** Best single-run score ever, any mode. */
  bestRunPoints: number;
  /** Most words found in a single run ever, any mode. */
  bestRunWords: number;
};

/**
 * Counts plus the profile's lifetime run tally. `gamesPlayed` is owned by
 * `Profile.gamesPlayed` in storage.ts (not duplicated inside the persisted
 * `AchievementCounts` blob) — callers build this with `withGamesPlayed`
 * right before doing progress math or rendering.
 */
export type AchievementContext = AchievementCounts & {
  gamesPlayed: number;
};

export function withGamesPlayed(
  counts: AchievementCounts,
  gamesPlayed: number,
): AchievementContext {
  return { ...counts, gamesPlayed };
}

export type TrackId =
  | "points"
  | "words"
  | "sessions"
  | "bestRunPoints"
  | "bestRunWords"
  | "len3"
  | "len4"
  | "len5"
  | "len6"
  | "len7plus"
  | "survivalTime"
  | "survivalWords";

export type TrackUnit = "pts" | "words" | "sec" | "runs";

export type TrackDef = {
  id: TrackId;
  label: string;
  hint: string;
  unit: TrackUnit;
  /** Ascending milestone thresholds — fast first stage, meatier later. */
  milestones: readonly number[];
  value: (ctx: AchievementContext) => number;
};

export const TRACKS: readonly TrackDef[] = [
  {
    id: "points",
    label: "Points haul",
    hint: "Cumulative points earned across every run",
    unit: "pts",
    milestones: [50, 150, 400, 1000, 2500, 5000, 10000],
    value: (c) => c.totalPoints,
  },
  {
    id: "words",
    label: "Word collector",
    hint: "Unique words you've ever found",
    unit: "words",
    milestones: [5, 15, 40, 100, 250, 500, 1000],
    value: (c) => c.uniqueWords.length,
  },
  {
    id: "sessions",
    label: "Couch sessions",
    hint: "Runs completed, win, lose, or quit",
    unit: "runs",
    milestones: [1, 5, 10, 25, 50, 100, 250],
    value: (c) => c.gamesPlayed,
  },
  {
    id: "bestRunPoints",
    label: "Best haul",
    hint: "Highest points scored in a single run",
    unit: "pts",
    milestones: [10, 25, 50, 100, 200, 400],
    value: (c) => c.bestRunPoints,
  },
  {
    id: "bestRunWords",
    label: "Word rush",
    hint: "Most words found in a single run",
    unit: "words",
    milestones: [5, 10, 15, 25, 40],
    value: (c) => c.bestRunWords,
  },
  {
    id: "len3",
    label: "3-letter finds",
    hint: "Quick nabs, exactly 3 letters",
    unit: "words",
    milestones: [5, 15, 40, 100, 250],
    value: (c) => c.lengthCounts["3"] ?? 0,
  },
  {
    id: "len4",
    label: "4-letter finds",
    hint: "4-letter word hauls",
    unit: "words",
    milestones: [5, 15, 35, 75, 150],
    value: (c) => c.lengthCounts["4"] ?? 0,
  },
  {
    id: "len5",
    label: "5-letter finds",
    hint: "5-letter word hauls",
    unit: "words",
    milestones: [3, 10, 25, 60, 120],
    value: (c) => c.lengthCounts["5"] ?? 0,
  },
  {
    id: "len6",
    label: "6-letter finds",
    hint: "6-letter word hauls",
    unit: "words",
    milestones: [2, 6, 15, 35, 70],
    value: (c) => c.lengthCounts["6"] ?? 0,
  },
  {
    id: "len7plus",
    label: "Long word hunter",
    hint: "Words 7 letters or longer",
    unit: "words",
    milestones: [1, 3, 8, 20, 40],
    value: (c) => c.lengthCounts["7plus"] ?? 0,
  },
  {
    id: "survivalTime",
    label: "Longest survival",
    hint: "Best time lasted in Survival mode",
    unit: "sec",
    milestones: [30, 60, 120, 300, 600],
    value: (c) => Math.floor(c.survivalBestMs / 1000),
  },
  {
    id: "survivalWords",
    label: "Survival hauls",
    hint: "Words nabbed while the clock ticked down",
    unit: "words",
    milestones: [10, 25, 60, 150, 300],
    value: (c) => c.survivalWordsFound,
  },
];

export function defaultAchievementCounts(): AchievementCounts {
  return {
    totalPoints: 0,
    uniqueWords: [],
    lengthCounts: { "3": 0, "4": 0, "5": 0, "6": 0, "7plus": 0 },
    survivalBestMs: 0,
    survivalWordsFound: 0,
    bestRunPoints: 0,
    bestRunWords: 0,
  };
}

/** Migrates old/missing blobs — every field defaults safely so new tracks (e.g. survival) backfill at 0. */
export function normalizeAchievementCounts(
  raw: Partial<AchievementCounts> | undefined | null,
): AchievementCounts {
  const base = defaultAchievementCounts();
  if (!raw) return base;
  const uniqueWords = Array.isArray(raw.uniqueWords)
    ? Array.from(
        new Set(raw.uniqueWords.filter((w) => typeof w === "string").map((w) => w.toLowerCase())),
      )
    : base.uniqueWords;
  return {
    totalPoints: typeof raw.totalPoints === "number" ? raw.totalPoints : base.totalPoints,
    uniqueWords,
    lengthCounts: { ...base.lengthCounts, ...raw.lengthCounts },
    survivalBestMs:
      typeof raw.survivalBestMs === "number" ? raw.survivalBestMs : base.survivalBestMs,
    survivalWordsFound:
      typeof raw.survivalWordsFound === "number" ? raw.survivalWordsFound : base.survivalWordsFound,
    bestRunPoints: typeof raw.bestRunPoints === "number" ? raw.bestRunPoints : base.bestRunPoints,
    bestRunWords: typeof raw.bestRunWords === "number" ? raw.bestRunWords : base.bestRunWords,
  };
}

export type TrackProgress = {
  track: TrackDef;
  value: number;
  /** Number of milestones cleared. */
  stage: number;
  nextMilestone: number | null;
  /** 0..1 toward `nextMilestone`; 1 when maxed. */
  progress: number;
  maxed: boolean;
};

export function stageForValue(value: number, milestones: readonly number[]): number {
  let stage = 0;
  for (const m of milestones) {
    if (value >= m) stage++;
    else break;
  }
  return stage;
}

export function trackProgress(ctx: AchievementContext, track: TrackDef): TrackProgress {
  const value = track.value(ctx);
  const stage = stageForValue(value, track.milestones);
  const maxed = stage >= track.milestones.length;
  const prevMilestone = stage > 0 ? track.milestones[stage - 1]! : 0;
  const nextMilestone = maxed ? null : track.milestones[stage]!;
  const span = nextMilestone != null ? nextMilestone - prevMilestone : 0;
  const progress = maxed
    ? 1
    : span <= 0
      ? 1
      : Math.min(1, Math.max(0, (value - prevMilestone) / span));
  return { track, value, stage, nextMilestone, progress, maxed };
}

export function allTrackProgress(ctx: AchievementContext): TrackProgress[] {
  return TRACKS.map((track) => trackProgress(ctx, track));
}

export type StageUp = {
  id: TrackId;
  label: string;
  unit: TrackUnit;
  stage: number;
  milestone: number;
};

export type RunHaul = {
  /**
   * Plain string, not the engine's `GameMode` union — decouples achievements
   * from engine mode changes. Survival-specific tracks only update when
   * `mode === "survival"`.
   */
  mode: string;
  /** Points earned this run (clamped to ≥ 0 before accumulating). */
  points: number;
  /** Words found this run, any case — normalized here. */
  words: string[];
  /** Survival extension point: how long the run lasted, ms. */
  durationSurvivedMs?: number;
};

/**
 * Applies one finished run's haul to stored counts. Pure — storage.ts persists
 * the result. `gamesPlayedAfter` is the profile's lifetime run tally *after*
 * this run was counted (storage.ts increments that counter itself); the
 * "before" snapshot for stage-up diffing is simply one less.
 */
export function applyRunToAchievements(
  counts: AchievementCounts,
  haul: RunHaul,
  gamesPlayedAfter: number,
): { next: AchievementCounts; stageUps: StageUp[]; touched: TrackId[] } {
  const before = allTrackProgress(withGamesPlayed(counts, Math.max(0, gamesPlayedAfter - 1)));

  const uniqueSet = new Set(counts.uniqueWords);
  const lengthCounts = { ...counts.lengthCounts };
  for (const raw of haul.words) {
    const word = raw.toLowerCase();
    uniqueSet.add(word);
    const bucket = lengthBucket(word.length);
    lengthCounts[bucket] = (lengthCounts[bucket] ?? 0) + 1;
  }

  const isSurvival = haul.mode === "survival";
  const runPoints = Math.max(0, haul.points);
  const next: AchievementCounts = {
    totalPoints: counts.totalPoints + runPoints,
    uniqueWords: Array.from(uniqueSet),
    lengthCounts,
    survivalBestMs: isSurvival
      ? Math.max(counts.survivalBestMs, haul.durationSurvivedMs ?? 0)
      : counts.survivalBestMs,
    survivalWordsFound: isSurvival
      ? counts.survivalWordsFound + haul.words.length
      : counts.survivalWordsFound,
    bestRunPoints: Math.max(counts.bestRunPoints, runPoints),
    bestRunWords: Math.max(counts.bestRunWords, haul.words.length),
  };

  const after = allTrackProgress(withGamesPlayed(next, gamesPlayedAfter));
  const stageUps: StageUp[] = [];
  const touched: TrackId[] = [];
  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i]!;
    if (after[i]!.value > before[i]!.value) touched.push(track.id);
    if (after[i]!.stage > before[i]!.stage) {
      stageUps.push({
        id: track.id,
        label: track.label,
        unit: track.unit,
        stage: after[i]!.stage,
        milestone: track.milestones[after[i]!.stage - 1]!,
      });
    }
  }

  return { next, stageUps, touched };
}

export function trackById(id: TrackId): TrackDef {
  const track = TRACKS.find((t) => t.id === id);
  if (!track) throw new Error(`Unknown achievement track: ${id}`);
  return track;
}

/** "1m 30s" style label for survival seconds — whimsical, no em dashes. */
export function formatSurvivalSeconds(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
