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
  mode: "target" | "timed";
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
};

export type DevicePrefs = {
  soundEnabled: boolean;
  /** Looping background music (home / couch crew / quiet on play). Separate from SFX. Default on. */
  menuMusicEnabled: boolean;
  /** Unfound valid words on the board (not target pts remaining). Default off = discovery. */
  showWordsLeft: boolean;
  activeProfileId: string;
};

function normalizePrefs(prefs: Partial<DevicePrefs> & { activeProfileId?: string }): DevicePrefs {
  return {
    soundEnabled: prefs.soundEnabled ?? true,
    menuMusicEnabled: prefs.menuMusicEnabled ?? true,
    showWordsLeft: prefs.showWordsLeft ?? false,
    activeProfileId: prefs.activeProfileId ?? "",
  };
}

export type StoredBlob = {
  profiles: Profile[];
  prefs: DevicePrefs;
};

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
  return {
    id: p.id,
    name: p.name,
    highScores: normalizeHighScores(p.highScores),
    history: Array.isArray(p.history) ? p.history : [],
    gamesPlayed: p.gamesPlayed ?? 0,
    wordsFound: p.wordsFound ?? 0,
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
      },
    ],
    prefs: { soundEnabled: true, menuMusicEnabled: true, showWordsLeft: false, activeProfileId: id },
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
    return { prefs, profiles };
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

/** Persist one finished run onto the active profile (history + counters + highs). */
export function recordFinishedRun(input: {
  score: number;
  scoreKey: string;
  mode: "target" | "timed";
  grid: number;
  minWordLength: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
  reason: "won" | "timeout" | "quit";
  wordsFound: number;
}): { isHighScore: boolean } {
  const isHighScore = upsertHighScore(input.scoreKey, input.score);
  recordGameStats(input.wordsFound);
  const store = loadStore();
  const profile = store.profiles.find((p) => p.id === store.prefs.activeProfileId);
  if (!profile) return { isHighScore };
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
  saveStore(store);
  return { isHighScore };
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

export function setShowWordsLeft(enabled: boolean) {
  const store = loadStore();
  store.prefs.showWordsLeft = enabled;
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

/** Ephemeral last run for results screen. */
export type LastRun = {
  score: number;
  found: string[];
  missed: string[];
  reason: "won" | "timeout" | "quit";
  mode: "target" | "timed";
  grid: number;
  topology?: "square" | "hex";
  detail: string;
  isHighScore: boolean;
  minWordLength: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
};

const LAST_RUN = "couch-potato:last-run";

export function saveLastRun(run: LastRun) {
  sessionStorage.setItem(LAST_RUN, JSON.stringify(run));
}

export function loadLastRun(): LastRun | null {
  try {
    const raw = sessionStorage.getItem(LAST_RUN);
    return raw ? (JSON.parse(raw) as LastRun) : null;
  } catch {
    return null;
  }
}

export type PlayLaunch = {
  mode: "target" | "timed";
  grid: 4 | 5 | 6;
  topology?: "square" | "hex";
  minWordLength?: 3 | 4 | 5;
  difficulty?: "easy" | "medium" | "hard";
  duration?: 30 | 60 | 90 | 120;
};

const LAUNCH = "couch-potato:launch";

export function saveLaunch(launch: PlayLaunch) {
  sessionStorage.setItem(LAUNCH, JSON.stringify(launch));
}

export function loadLaunch(): PlayLaunch {
  try {
    const raw = sessionStorage.getItem(LAUNCH);
    if (raw) return JSON.parse(raw) as PlayLaunch;
  } catch {
    /* ignore */
  }
  return { mode: "target", grid: 4, topology: "square", difficulty: "easy", minWordLength: 3 };
}

/** Human label from engine highScoreKey (strips profile id prefix). */
export function formatHighScoreLabel(scoreKey: string): string {
  const parts = scoreKey.split(":");
  // profileId:size:topology:target:difficulty:minN  OR  …:timed:duration:minN
  // Legacy (no topology): profileId:size:target:…
  if (parts.length >= 6) {
    const [, size, topology, mode, detail, minPart] = parts;
    const min = (minPart ?? "").replace(/^min/, "") || "?";
    const shape = topology === "hex" ? "Honeycomb" : "square";
    if (mode === "target") {
      return `${size}×${size} ${shape} · Goal · ${detail} · ${min}+`;
    }
    return `${size}×${size} ${shape} · Timed · ${detail}s · ${min}+`;
  }
  if (parts.length < 5) return scoreKey;
  const [, size, mode, detail, minPart] = parts;
  const min = (minPart ?? "").replace(/^min/, "") || "?";
  if (mode === "target") {
    return `${size}×${size} Goal · ${detail} · ${min}+`;
  }
  return `${size}×${size} Timed · ${detail}s · ${min}+`;
}

export function formatWhen(iso: string): string {
  if (!iso) return "sometime on the couch";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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
