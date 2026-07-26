import {
  applyRunToAchievements,
  defaultAchievementCounts,
  normalizeAchievementCounts,
  withGamesPlayed,
  type AchievementContext,
  type AchievementCounts,
  type StageUp,
  type TrackId,
} from "./achievements";
import {
  applyRunToPaceStats,
  defaultPaceStats,
  normalizePaceStats,
  seedPaceFromTimedHistory,
  type PaceStats,
} from "./profileStats";

export type HighScoreEntry = {
  score: number;
  at: string; // ISO
};

/** Legacy number values migrate on read. */
export type HighScores = Record<string, HighScoreEntry | number>;

export type GameHistoryEntry = {
  id: string;
  at: string;
  score: number;
  mode: "target" | "timed" | "survival";
  grid: number;
  minWordLength: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
  reason: "won" | "timeout" | "quit";
  wordsFound: number;
  isHighScore: boolean;
};

export type Profile = {
  id: string;
  name: string;
  highScores: HighScores;
  history: GameHistoryEntry[];
  gamesPlayed: number;
  wordsFound: number;
  /** Couch medals progression — see `achievements.ts` for the authoritative math. */
  achievements: AchievementCounts;
  /**
   * Lifetime pace aggregates for Potato Board (avg words/min + avg word length).
   * See `profileStats.ts` for definitions + migration.
   */
  pace: PaceStats;
};

/** `system` follows OS `prefers-color-scheme`; `light`/`dark` are explicit user overrides. */
export type ThemePreference = "light" | "dark" | "system";

/** Display face: clean (Lexend, default) or pixel (Jersey 15). Flips all font CSS vars. */
export type FontPreference = "clean" | "pixel";

export type DevicePrefs = {
  soundEnabled: boolean;
  /**
   * Looping background music (home / couch crew / quiet on play). Separate from SFX. Default off.
   * Lobby soft invite (cue the jam) when false and `lobbyJamInviteDismissed` is false.
   */
  menuMusicEnabled: boolean;
  /**
   * Soft background-music invite dismissed (or accepted). Default false → show once while jam is off.
   * Options can still flip background music anytime; invite does not reappear after dismiss.
   */
  lobbyJamInviteDismissed: boolean;
  /** Unfound valid words on the board (not target points remaining). Default off = discovery. */
  showWordsLeft: boolean;
  /**
   * Player finished (or skipped) the interactive how-to. Default false → gate lobby once.
   * Options “View Tutorial” clears this.
   */
  howToSeen: boolean;
  /** Default system; explicit light/dark once the player picks via the toggle. */
  themePreference: ThemePreference;
  /** Default clean (Lexend); pixel = Jersey 15 everywhere (one face — not titles-only). */
  fontPreference: FontPreference;
  /**
   * Extra house-ban tokens (lowercase a–z, ≥3). Device-local; snapshotted into the
   * play lexicon at run start so mid-edit never touches an open haul.
   */
  customBlockedWords: string[];
  activeProfileId: string;
};

/** Soft cap so lobby pills stay usable. */
export const CUSTOM_BLOCK_CAP = 32;

export function normalizeCustomBlockedWords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const w = item.trim().toLowerCase();
    if (!/^[a-z]+$/.test(w) || w.length < 3) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= CUSTOM_BLOCK_CAP) break;
  }
  return out;
}

function normalizePrefs(prefs: Partial<DevicePrefs> & { activeProfileId?: string }): DevicePrefs {
  return {
    soundEnabled: prefs.soundEnabled ?? true,
    menuMusicEnabled: prefs.menuMusicEnabled ?? false,
    lobbyJamInviteDismissed: prefs.lobbyJamInviteDismissed ?? false,
    showWordsLeft: prefs.showWordsLeft ?? false,
    // Missing key = legacy install — don't force the coach on existing players.
    howToSeen: typeof prefs.howToSeen === "boolean" ? prefs.howToSeen : true,
    themePreference: prefs.themePreference ?? "system",
    fontPreference: prefs.fontPreference === "pixel" ? "pixel" : "clean",
    customBlockedWords: normalizeCustomBlockedWords(prefs.customBlockedWords),
    activeProfileId: prefs.activeProfileId ?? "",
  };
}

export type StoredBlob = {
  profiles: Profile[];
  prefs: DevicePrefs;
  /**
   * Bitflags for one-shot prefs migrations already applied.
   * `1` = Type face is full-UI (was titles-only); sticky Pixel reset → Clean.
   */
  migrations?: number;
};

/** Titles-only Pixel → full-face Type; force Clean so Pixel is opt-in again. */
const MIG_TYPE_FACE_FULL = 1;

const KEY = "couch-potato:v1";
const HISTORY_CAP = 20;

function uid() {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

function runId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeHighScores(raw: HighScores | undefined): Record<string, HighScoreEntry> {
  const out: Record<string, HighScoreEntry> = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number") {
      out[k] = { score: v, at: "" };
    } else if (v && typeof v.score === "number") {
      out[k] = { score: v.score, at: v.at || "" };
    }
  }
  return out;
}

function normalizeProfile(p: Partial<Profile> & { id: string; name: string }): Profile {
  const history = Array.isArray(p.history) ? p.history : [];
  const hadPace = p.pace != null && typeof p.pace === "object";
  let pace = normalizePaceStats(p.pace);
  // Pre-pace profiles: seed WPM from recent Timed runs (sprint length ≈ elapsed).
  // Letter totals can't be rebuilt from history → avg length starts fresh.
  if (!hadPace && history.length > 0) {
    const seeded = seedPaceFromTimedHistory(history);
    pace = { ...pace, ...seeded };
  }
  return {
    id: p.id,
    name: p.name,
    highScores: normalizeHighScores(p.highScores),
    history,
    gamesPlayed: p.gamesPlayed ?? 0,
    wordsFound: p.wordsFound ?? 0,
    achievements: normalizeAchievementCounts(p.achievements),
    pace,
  };
}

export function defaultBlob(): StoredBlob {
  const id = uid();
  return {
    profiles: [
      {
        id,
        name: "Potato",
        highScores: {},
        history: [],
        gamesPlayed: 0,
        wordsFound: 0,
        achievements: defaultAchievementCounts(),
        pace: defaultPaceStats(),
      },
    ],
    prefs: {
      soundEnabled: true,
      menuMusicEnabled: false,
      lobbyJamInviteDismissed: false,
      showWordsLeft: false,
      howToSeen: false,
      themePreference: "system",
      fontPreference: "clean",
      customBlockedWords: [],
      activeProfileId: id,
    },
    migrations: MIG_TYPE_FACE_FULL,
  };
}

export function loadStore(): StoredBlob {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const blob = defaultBlob();
      saveStore(blob);
      return blob;
    }
    const parsed = JSON.parse(raw) as StoredBlob;
    const prefs = normalizePrefs(parsed.prefs ?? { activeProfileId: "" });
    const profiles = (parsed.profiles ?? []).map((p) => normalizeProfile(p as Profile));
    if (!prefs.activeProfileId && profiles[0]) {
      prefs.activeProfileId = profiles[0].id;
    }
    let migrations = parsed.migrations ?? 0;
    let dirty = false;
    // Pixel used to flip titles only; full-face Type needs a fresh opt-in → Clean default.
    if ((migrations & MIG_TYPE_FACE_FULL) === 0) {
      prefs.fontPreference = "clean";
      migrations |= MIG_TYPE_FACE_FULL;
      dirty = true;
    }
    const blob: StoredBlob = { prefs, profiles, migrations };
    if (dirty) saveStore(blob);
    return blob;
  } catch {
    return defaultBlob();
  }
}

export function saveStore(blob: StoredBlob) {
  localStorage.setItem(KEY, JSON.stringify(blob));
}

export function loadDevicePrefs(): DevicePrefs {
  return loadStore().prefs;
}

export function getActiveProfile(): Profile {
  const store = loadStore();
  const p = store.profiles.find((x) => x.id === store.prefs.activeProfileId) ?? store.profiles[0]!;
  return normalizeProfile(p);
}

export function upsertHighScore(scoreKey: string, score: number): boolean {
  const store = loadStore();
  const profile = store.profiles.find((p) => p.id === store.prefs.activeProfileId);
  if (!profile) return false;
  const highs = normalizeHighScores(profile.highScores);
  const prev = highs[scoreKey]?.score ?? 0;
  if (score <= prev) {
    profile.highScores = highs;
    saveStore(store);
    return false;
  }
  highs[scoreKey] = { score, at: new Date().toISOString() };
  profile.highScores = highs;
  saveStore(store);
  return true;
}

export function recordGameStats(wordsFound: number) {
  const store = loadStore();
  const profile = store.profiles.find((p) => p.id === store.prefs.activeProfileId);
  if (!profile) return;
  profile.gamesPlayed += 1;
  profile.wordsFound += wordsFound;
  saveStore(store);
}

/** Persist one finished run onto the active profile (history + counters + highs + medals). */
export function recordFinishedRun(input: {
  score: number;
  scoreKey: string;
  mode: "target" | "timed" | "survival";
  grid: number;
  minWordLength: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
  reason: "won" | "timeout" | "quit";
  wordsFound: number;
  /** Words found this run (any case) — feeds word collector + length-haul tracks. */
  words?: string[];
  /** Survival extension point: how long the run lasted, ms. */
  survivalDurationMs?: number;
  /**
   * Active play this run (ms) for Potato Board WPM — pause excluded.
   * Timed/Survival: engine clock elapsed; Goal: wall-clock while unpaused.
   */
  activePlayMs?: number;
}): {
  isHighScore: boolean;
  achievements: AchievementContext;
  stageUps: StageUp[];
  touched: TrackId[];
} {
  const isHighScore = upsertHighScore(input.scoreKey, input.score);
  recordGameStats(input.wordsFound);
  const store = loadStore();
  const profile = store.profiles.find((p) => p.id === store.prefs.activeProfileId);
  if (!profile) {
    return {
      isHighScore,
      achievements: withGamesPlayed(defaultAchievementCounts(), 0),
      stageUps: [],
      touched: [],
    };
  }
  const entry: GameHistoryEntry = {
    id: runId(),
    at: new Date().toISOString(),
    score: input.score,
    mode: input.mode,
    grid: input.grid,
    minWordLength: input.minWordLength,
    difficulty: input.difficulty,
    duration: input.duration,
    reason: input.reason,
    wordsFound: input.wordsFound,
    isHighScore,
  };
  const history = [entry, ...(profile.history ?? [])].slice(0, HISTORY_CAP);
  profile.history = history;

  // `profile.gamesPlayed` was already bumped by `recordGameStats` above (reloaded
  // fresh here), so it's already the post-run tally the "Couch sessions" track wants.
  const { next, stageUps, touched } = applyRunToAchievements(
    normalizeAchievementCounts(profile.achievements),
    {
      mode: input.mode,
      points: input.score,
      words: input.words ?? [],
      durationSurvivedMs: input.survivalDurationMs,
    },
    profile.gamesPlayed,
  );
  profile.achievements = next;

  const words = input.words ?? [];
  const activePlayMs =
    input.activePlayMs ?? (input.mode === "survival" ? input.survivalDurationMs : undefined);
  profile.pace = applyRunToPaceStats(normalizePaceStats(profile.pace), {
    words,
    activePlayMs,
  });

  saveStore(store);
  return {
    isHighScore,
    achievements: withGamesPlayed(next, profile.gamesPlayed),
    stageUps,
    touched,
  };
}

export function setSoundEnabled(enabled: boolean) {
  const store = loadStore();
  store.prefs.soundEnabled = enabled;
  saveStore(store);
}

export function setMenuMusicEnabled(enabled: boolean) {
  const store = loadStore();
  store.prefs.menuMusicEnabled = enabled;
  saveStore(store);
}

/** Hide the background-music invite for good (after Turn on or Later). */
export function dismissLobbyJamInvite() {
  const store = loadStore();
  store.prefs.lobbyJamInviteDismissed = true;
  saveStore(store);
}

export function setShowWordsLeft(enabled: boolean) {
  const store = loadStore();
  store.prefs.showWordsLeft = enabled;
  saveStore(store);
}

/** Mark interactive how-to finished (or clear via Options replay). */
export function setHowToSeen(seen: boolean) {
  const store = loadStore();
  store.prefs.howToSeen = seen;
  saveStore(store);
}

export function setThemePreference(pref: ThemePreference) {
  const store = loadStore();
  store.prefs.themePreference = pref;
  saveStore(store);
}

export function setFontPreference(pref: FontPreference) {
  const store = loadStore();
  store.prefs.fontPreference = pref;
  saveStore(store);
}

/** Replace the device house-ban list (normalized + capped). */
export function setCustomBlockedWords(words: string[]) {
  const store = loadStore();
  store.prefs.customBlockedWords = normalizeCustomBlockedWords(words);
  saveStore(store);
}

export function setActiveProfile(id: string) {
  const store = loadStore();
  if (!store.profiles.some((p) => p.id === id)) return;
  store.prefs.activeProfileId = id;
  saveStore(store);
}

export function createProfile(name: string): Profile {
  const store = loadStore();
  const profile: Profile = {
    id: uid(),
    name: name.trim() || "Potato",
    highScores: {},
    history: [],
    gamesPlayed: 0,
    wordsFound: 0,
    achievements: defaultAchievementCounts(),
    pace: defaultPaceStats(),
  };
  store.profiles.push(profile);
  store.prefs.activeProfileId = profile.id;
  saveStore(store);
  return profile;
}

export function renameProfile(id: string, name: string) {
  const store = loadStore();
  const p = store.profiles.find((x) => x.id === id);
  if (!p) return;
  p.name = name.trim() || p.name;
  saveStore(store);
}

/**
 * Last finished run for the results screen + lobby "Last results".
 * Profile-scoped in localStorage so refresh / leave / return still peeks results.
 */
export type LastRun = {
  score: number;
  found: string[];
  missed: string[];
  /**
   * Other unfound board words (not in `missed` long tease). Results “More crumbs”
   * box — optional on legacy runs.
   */
  missedMore?: string[];
  reason: "won" | "timeout" | "quit";
  mode: "target" | "timed" | "survival";
  grid: number;
  topology?: "square" | "hex";
  /** Final board letters (post-rotate) for Results mini replay — absent on legacy runs. */
  letters?: string[][];
  detail: string;
  isHighScore: boolean;
  minWordLength: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
  /** Couch medals snapshot for this run — powers the results "Couch medals" peek. */
  achievements?: {
    snapshot: AchievementContext;
    stageUps: StageUp[];
    touched: TrackId[];
  };
};

const LAST_RUN = "couch-potato:last-run";

type LastRunMap = Record<string, LastRun>;

function isLastRunShape(v: unknown): v is LastRun {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.score === "number" && Array.isArray(o.found) && typeof o.reason === "string";
}

function loadLastRunMap(): LastRunMap {
  try {
    const raw = localStorage.getItem(LAST_RUN);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      // Legacy: single LastRun object (pre profile-map).
      if (isLastRunShape(parsed)) {
        const id = loadStore().prefs.activeProfileId;
        const map: LastRunMap = id ? { [id]: parsed } : {};
        localStorage.setItem(LAST_RUN, JSON.stringify(map));
        return map;
      }
      if (parsed && typeof parsed === "object") return parsed as LastRunMap;
    }
  } catch {
    /* ignore */
  }
  // Migrate sessionStorage → localStorage (pre-persist era).
  try {
    const raw = sessionStorage.getItem(LAST_RUN);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isLastRunShape(parsed)) {
        const id = loadStore().prefs.activeProfileId;
        const map: LastRunMap = id ? { [id]: parsed } : {};
        localStorage.setItem(LAST_RUN, JSON.stringify(map));
        sessionStorage.removeItem(LAST_RUN);
        return map;
      }
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveLastRun(run: LastRun) {
  const id = loadStore().prefs.activeProfileId;
  if (!id) return;
  const map = loadLastRunMap();
  map[id] = run;
  localStorage.setItem(LAST_RUN, JSON.stringify(map));
  try {
    sessionStorage.removeItem(LAST_RUN);
  } catch {
    /* ignore */
  }
}

/** Active profile's last finished run, or null if none yet. */
export function loadLastRun(): LastRun | null {
  const id = loadStore().prefs.activeProfileId;
  if (!id) return null;
  const run = loadLastRunMap()[id] ?? null;
  if (!run) return null;
  // Backfill letters from the live-play snapshot when an older finish omitted them.
  if (!isLettersGrid(run.letters)) {
    const snap = loadBoardSnapshot();
    if (snap && snap.size === run.grid) {
      const patched: LastRun = {
        ...run,
        letters: snap.letters,
        topology: run.topology ?? snap.topology,
      };
      saveLastRun(patched);
      return patched;
    }
  }
  return run;
}

function isLettersGrid(v: unknown): v is string[][] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    Array.isArray(v[0]) &&
    v[0]!.length > 0 &&
    typeof v[0]![0] === "string"
  );
}

export type BoardSnapshot = {
  letters: string[][];
  topology: "square" | "hex";
  size: number;
};

const BOARD_SNAP = "couch-potato:board-snap";

/** Deep-clone final / live board letters for Results replay. */
export function cloneLetters(letters: string[][]): string[][] {
  return letters.map((row) => row.slice());
}

/**
 * Written while a run is live (and on rotate) so Results can still show the
 * board if `LastRun.letters` was missing from an older finish path.
 */
export function saveBoardSnapshot(snap: BoardSnapshot) {
  try {
    localStorage.setItem(
      BOARD_SNAP,
      JSON.stringify({
        ...snap,
        letters: cloneLetters(snap.letters),
      }),
    );
  } catch {
    /* ignore quota */
  }
}

export function loadBoardSnapshot(): BoardSnapshot | null {
  try {
    const raw = localStorage.getItem(BOARD_SNAP);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (!isLettersGrid(o.letters)) return null;
    if (typeof o.size !== "number") return null;
    const topology = o.topology === "hex" ? "hex" : "square";
    return { letters: o.letters, topology, size: o.size };
  } catch {
    return null;
  }
}

export type PlayLaunch = {
  mode: "target" | "timed" | "survival";
  grid: 4 | 5 | 6;
  topology?: "square" | "hex";
  minWordLength?: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
};

const LAUNCH = "couch-potato:launch";
const LAST_LAUNCH = "couch-potato:last-launch";

const DEFAULT_LAUNCH: PlayLaunch = {
  mode: "target",
  grid: 4,
  topology: "square",
  difficulty: "easy",
  minWordLength: 3,
  duration: 60,
};

/** Clamp raw JSON into a valid lobby/play launch (session or last-played). */
export function normalizePlayLaunch(raw: unknown): PlayLaunch {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LAUNCH };
  const o = raw as Record<string, unknown>;
  const mode =
    o.mode === "timed" || o.mode === "survival" || o.mode === "target" ? o.mode : "target";
  const grid = o.grid === 5 || o.grid === 6 ? o.grid : 4;
  const topology = o.topology === "hex" ? "hex" : "square";
  const minWordLength = o.minWordLength === 4 || o.minWordLength === 5 ? o.minWordLength : 3;
  const difficulty =
    o.difficulty === "medium" || o.difficulty === "hard" || o.difficulty === "easy"
      ? o.difficulty
      : "easy";
  const duration =
    o.duration === 30 || o.duration === 90 || o.duration === 120 || o.duration === 60
      ? o.duration
      : 60;
  return {
    mode,
    grid,
    topology,
    minWordLength,
    difficulty,
    duration,
  };
}

/** Live play launch + durable last-played lobby prefs (device-local). */
export function saveLaunch(launch: PlayLaunch) {
  const normalized = normalizePlayLaunch(launch);
  const raw = JSON.stringify(normalized);
  try {
    sessionStorage.setItem(LAUNCH, raw);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(LAST_LAUNCH, raw);
  } catch {
    /* ignore */
  }
}

export function loadLaunch(): PlayLaunch {
  try {
    const session = sessionStorage.getItem(LAUNCH);
    if (session) return normalizePlayLaunch(JSON.parse(session));
  } catch {
    /* ignore */
  }
  try {
    const last = localStorage.getItem(LAST_LAUNCH);
    if (last) return normalizePlayLaunch(JSON.parse(last));
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_LAUNCH };
}

/** Human label from engine highScoreKey (strips profile id prefix). */
export function formatHighScoreLabel(scoreKey: string): string {
  const parts = scoreKey.split(":");
  // Current: profileId:size:topology:target|survival:difficulty:minN
  //          …:timed:duration:difficulty:minN
  // Legacy timed (no difficulty): …:timed:duration:minN
  // Legacy (no topology): profileId:size:mode:…
  if (parts.length >= 7 && parts[3] === "timed") {
    const [, size, topology, , duration, difficulty, minPart] = parts;
    const min = (minPart ?? "").replace(/^min/, "") || "?";
    const shape = topology === "hex" ? "Honeycomb" : "square";
    return `${size}×${size} ${shape} · Timed · ${difficulty} · ${duration}s · ${min}+`;
  }
  if (parts.length >= 6) {
    const [, size, topology, mode, detail, minPart] = parts;
    const min = (minPart ?? "").replace(/^min/, "") || "?";
    const shape = topology === "hex" ? "Honeycomb" : "square";
    if (mode === "target") {
      return `${size}×${size} ${shape} · Goal · ${detail} · ${min}+`;
    }
    if (mode === "survival") {
      return `${size}×${size} ${shape} · Survival · ${detail} · ${min}+`;
    }
    return `${size}×${size} ${shape} · Timed · ${detail}s · ${min}+`;
  }
  if (parts.length < 5) return scoreKey;
  const [, size, mode, detail, minPart] = parts;
  const min = (minPart ?? "").replace(/^min/, "") || "?";
  if (mode === "target") {
    return `${size}×${size} Goal · ${detail} · ${min}+`;
  }
  if (mode === "survival") {
    return `${size}×${size} Survival · ${detail} · ${min}+`;
  }
  return `${size}×${size} Timed · ${detail}s · ${min}+`;
}

export function listHighScores(profile: Profile): {
  key: string;
  label: string;
  score: number;
  at: string;
}[] {
  const highs = normalizeHighScores(profile.highScores);
  return Object.entries(highs)
    .map(([key, entry]) => ({
      key,
      label: formatHighScoreLabel(key),
      score: entry.score,
      at: entry.at,
    }))
    .sort((a, b) => b.score - a.score);
}
