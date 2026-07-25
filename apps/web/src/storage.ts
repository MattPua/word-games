export type HighScores = Record<string, number>;

export type Profile = {
  id: string;
  name: string;
  highScores: HighScores;
  gamesPlayed: number;
  wordsFound: number;
};

export type DevicePrefs = {
  soundEnabled: boolean;
  activeProfileId: string;
};

export type StoredBlob = {
  profiles: Profile[];
  prefs: DevicePrefs;
};

const KEY = "couch-potato:v1";

function uid() {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultBlob(): StoredBlob {
  const id = uid();
  return {
    profiles: [
      {
        id,
        name: "Potato",
        highScores: {},
        gamesPlayed: 0,
        wordsFound: 0,
      },
    ],
    prefs: { soundEnabled: true, activeProfileId: id },
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
    return JSON.parse(raw) as StoredBlob;
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
  return (
    store.profiles.find((p) => p.id === store.prefs.activeProfileId) ??
    store.profiles[0]!
  );
}

export function upsertHighScore(scoreKey: string, score: number): boolean {
  const store = loadStore();
  const profile = store.profiles.find(
    (p) => p.id === store.prefs.activeProfileId,
  );
  if (!profile) return false;
  const prev = profile.highScores[scoreKey] ?? 0;
  if (score <= prev) return false;
  profile.highScores[scoreKey] = score;
  saveStore(store);
  return true;
}

export function recordGameStats(wordsFound: number) {
  const store = loadStore();
  const profile = store.profiles.find(
    (p) => p.id === store.prefs.activeProfileId,
  );
  if (!profile) return;
  profile.gamesPlayed += 1;
  profile.wordsFound += wordsFound;
  saveStore(store);
}

export function setSoundEnabled(enabled: boolean) {
  const store = loadStore();
  store.prefs.soundEnabled = enabled;
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
  detail: string;
  isHighScore: boolean;
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
  return { mode: "target", grid: 4, difficulty: "easy", minWordLength: 3 };
}
