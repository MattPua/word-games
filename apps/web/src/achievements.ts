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

export type LengthBucket = "3" | "4" | "5" | "6" | "7" | "8" | "9plus";

export const LENGTH_BUCKETS: readonly LengthBucket[] = ["3", "4", "5", "6", "7", "8", "9plus"];

/** Legacy key: pre-split haul that lumped every word ≥7 into one bucket. */
const LEGACY_7PLUS = "7plus";

export function lengthBucket(len: number): LengthBucket {
  if (len >= 9) return "9plus";
  if (len <= 3) return "3";
  return String(len) as LengthBucket;
}

/**
 * Per-track unlock timestamps (epoch ms). Index `i` = when stage `i + 1`
 * (milestone `milestones[i]`) was reached. Missing / shorter arrays = legacy
 * progress from before dating existed — UI treats those as unknown, never invents.
 */
export type StageUnlockedAt = Partial<Record<TrackId, number[]>>;

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
  /** When each track stage unlocked — stamped by `applyRunToAchievements`. */
  stageUnlockedAt: StageUnlockedAt;
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
  | "len7"
  | "len8"
  | "len9plus"
  | "survivalTime"
  | "survivalWords";

export type TrackUnit = "points" | "words" | "sec" | "runs";

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
    unit: "points",
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
    unit: "points",
    milestones: [10, 25, 50, 100, 200, 400],
    value: (c) => c.bestRunPoints,
  },
  {
    id: "bestRunWords",
    label: "Word rush",
    hint: "Most words found in a single run",
    unit: "words",
    // Keep early thresholds; ENABLE boards can clear 100+ — append only.
    milestones: [5, 10, 15, 25, 40, 75, 120, 200],
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
    id: "len7",
    label: "7-letter finds",
    hint: "7-letter word hauls",
    unit: "words",
    milestones: [1, 3, 8, 20, 40],
    value: (c) => c.lengthCounts["7"] ?? 0,
  },
  {
    id: "len8",
    label: "8-letter finds",
    hint: "8-letter word hauls",
    unit: "words",
    milestones: [1, 2, 5, 12, 25],
    value: (c) => c.lengthCounts["8"] ?? 0,
  },
  {
    id: "len9plus",
    label: "Long word hunter",
    hint: "Words 9 letters or longer",
    unit: "words",
    milestones: [1, 2, 4, 10, 20],
    value: (c) => c.lengthCounts["9plus"] ?? 0,
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
    lengthCounts: { "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9plus": 0 },
    survivalBestMs: 0,
    survivalWordsFound: 0,
    bestRunPoints: 0,
    bestRunWords: 0,
    stageUnlockedAt: {},
  };
}

const TRACK_ID_SET: ReadonlySet<string> = new Set(TRACKS.map((t) => t.id));

/** Migrates unlock-date map — known track ids only; drops non-finite / non-positive stamps. */
export function normalizeStageUnlockedAt(
  raw: Partial<Record<string, unknown>> | undefined | null,
): StageUnlockedAt {
  if (!raw || typeof raw !== "object") return {};
  const out: StageUnlockedAt = {};
  for (const [rawId, arr] of Object.entries(raw)) {
    // Legacy Long-word-hunter track id → new exact-7 track (same fold as lengthCounts).
    const id = rawId === "len7plus" ? "len7" : rawId;
    if (!TRACK_ID_SET.has(id) || !Array.isArray(arr)) continue;
    const cleaned: number[] = [];
    let any = false;
    for (let i = 0; i < arr.length; i++) {
      const n = arr[i];
      if (typeof n === "number" && Number.isFinite(n) && n > 0) {
        cleaned[i] = n;
        any = true;
      }
    }
    if (!any) continue;
    const existing = out[id as TrackId];
    if (!existing) {
      out[id as TrackId] = cleaned;
      continue;
    }
    // Prefer earlier unlock when both legacy + new stamps exist for the same stage.
    const merged = [...existing];
    for (let i = 0; i < cleaned.length; i++) {
      const n = cleaned[i];
      if (n == null) continue;
      const prev = merged[i];
      merged[i] = prev == null ? n : Math.min(prev, n);
    }
    out[id as TrackId] = merged;
  }
  return out;
}

/**
 * Migrates length haul counts. Known buckets win; legacy `7plus` (pre-split
 * ≥7 lump) folds into `7` so progress isn't wiped — exact past lengths aren't
 * recoverable. Unknown keys dropped.
 */
export function normalizeLengthCounts(
  raw: Partial<Record<string, number>> | undefined | null,
): Record<LengthBucket, number> {
  const out = { ...defaultAchievementCounts().lengthCounts };
  if (!raw) return out;
  for (const key of LENGTH_BUCKETS) {
    const n = raw[key];
    if (typeof n === "number" && Number.isFinite(n) && n > 0) out[key] = n;
  }
  const legacy = raw[LEGACY_7PLUS];
  if (typeof legacy === "number" && Number.isFinite(legacy) && legacy > 0) {
    out["7"] += legacy;
  }
  return out;
}

/** Migrates old/missing blobs — every field defaults safely so new tracks (e.g. survival) backfill at 0. */
export function normalizeAchievementCounts(
  raw:
    | (Partial<Omit<AchievementCounts, "lengthCounts">> & {
        lengthCounts?: Partial<Record<string, number>> | null;
      })
    | undefined
    | null,
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
    lengthCounts: normalizeLengthCounts(raw.lengthCounts),
    survivalBestMs:
      typeof raw.survivalBestMs === "number" ? raw.survivalBestMs : base.survivalBestMs,
    survivalWordsFound:
      typeof raw.survivalWordsFound === "number" ? raw.survivalWordsFound : base.survivalWordsFound,
    bestRunPoints: typeof raw.bestRunPoints === "number" ? raw.bestRunPoints : base.bestRunPoints,
    bestRunWords: typeof raw.bestRunWords === "number" ? raw.bestRunWords : base.bestRunWords,
    stageUnlockedAt: normalizeStageUnlockedAt(raw.stageUnlockedAt),
  };
}

export type TrackProgress = {
  track: TrackDef;
  value: number;
  /** Number of milestones cleared. */
  stage: number;
  nextMilestone: number | null;
  /**
   * Active medal threshold: the next milestone to clear, or the last milestone
   * when the track is fully cleared. UI shows this alone — never the full list.
   */
  currentMilestone: number;
  /** Milestones still locked on this track. 0 when maxed. */
  remainingStages: number;
  /** 0..1 toward `nextMilestone`; 1 when maxed. */
  progress: number;
  maxed: boolean;
  /**
   * Epoch ms when the current stage unlocked, if known. Null when stage 0 or
   * legacy progress without a stored stamp.
   */
  unlockedAt: number | null;
  /**
   * Per-stage unlock stamps (index `i` = stage `i + 1`). Sparse for legacy.
   * UI reads these — never invents dates from milestones alone.
   */
  stageUnlockedAt: readonly (number | undefined)[];
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
  const currentMilestone = maxed ? track.milestones[track.milestones.length - 1]! : nextMilestone!;
  const remainingStages = maxed ? 0 : track.milestones.length - stage;
  const span = nextMilestone != null ? nextMilestone - prevMilestone : 0;
  const progress = maxed
    ? 1
    : span <= 0
      ? 1
      : Math.min(1, Math.max(0, (value - prevMilestone) / span));
  const stageUnlockedAt = ctx.stageUnlockedAt[track.id] ?? [];
  const unlockedAt = stage > 0 ? (stageUnlockedAt[stage - 1] ?? null) : null;
  return {
    track,
    value,
    stage,
    nextMilestone,
    currentMilestone,
    remainingStages,
    progress,
    maxed,
    unlockedAt,
    stageUnlockedAt,
  };
}

/** Player-facing remaining-lock line — "3 still locked" / "All unlocked". No em dashes. */
export function formatRemainingStages(p: TrackProgress): string {
  if (p.maxed || p.remainingStages <= 0) return "All unlocked";
  return p.remainingStages === 1 ? "1 still locked" : `${p.remainingStages} still locked`;
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
  /** Epoch ms when this stage unlocked (same stamp written into counts). */
  unlockedAt: number;
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
 * `nowMs` stamps new stage unlocks (defaults to `Date.now()`; inject in tests).
 */
export function applyRunToAchievements(
  counts: AchievementCounts,
  haul: RunHaul,
  gamesPlayedAfter: number,
  nowMs: number = Date.now(),
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
  const stageUnlockedAt: StageUnlockedAt = { ...counts.stageUnlockedAt };
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
    stageUnlockedAt,
  };

  // Stage math only needs count fields; unlock stamps are filled below.
  const after = allTrackProgress(withGamesPlayed(next, gamesPlayedAfter));
  const stageUps: StageUp[] = [];
  const touched: TrackId[] = [];
  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i]!;
    if (after[i]!.value > before[i]!.value) touched.push(track.id);
    const prevStage = before[i]!.stage;
    const nextStage = after[i]!.stage;
    if (nextStage > prevStage) {
      const stamps = [...(stageUnlockedAt[track.id] ?? [])];
      for (let s = prevStage + 1; s <= nextStage; s++) {
        const idx = s - 1;
        if (stamps[idx] == null) stamps[idx] = nowMs;
      }
      stageUnlockedAt[track.id] = stamps;
      stageUps.push({
        id: track.id,
        label: track.label,
        unit: track.unit,
        stage: nextStage,
        milestone: track.milestones[nextStage - 1]!,
        unlockedAt: stamps[nextStage - 1]!,
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
