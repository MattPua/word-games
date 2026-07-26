const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const host =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

type PostHog = typeof import("posthog-js").default;

/** Flat props only — PostHog person/event property values. */
export type AnalyticsProps = Record<string, string | number | boolean | null>;

let client: PostHog | null = null;
let ready = false;
/** Errors that arrived before posthog-js finished loading. */
const pendingExceptions: Array<{ error: unknown; props?: AnalyticsProps }> = [];
/** Product events that arrived before SDK ready (lobby Play can beat init). */
const pendingEvents: Array<{ event: string; props?: AnalyticsProps }> = [];

const SESSION_RUN_KEY = "cp_session_run";
const PLAY_VIA_KEY = "cp_play_via";

export type PlayVia = "lobby" | "results" | "howto" | "restart";

function hasRealKey(): boolean {
  return Boolean(key && key !== "phc_placeholder");
}

function flushPending() {
  if (!ready || !client) return;
  while (pendingExceptions.length) {
    const next = pendingExceptions.shift()!;
    client.captureException(next.error, next.props);
  }
  while (pendingEvents.length) {
    const next = pendingEvents.shift()!;
    client.capture(next.event, next.props);
  }
}

/** Init only when a real key is set — keeps posthog-js off the lobby cold chunk. */
export function initAnalytics() {
  if (!hasRealKey()) return;
  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key!, {
      api_host: host,
      person_profiles: "identified_only",
      // Unhandled errors + promise rejections → `$exception` (Error tracking).
      capture_exceptions: true,
    });
    client = posthog;
    ready = true;
    flushPending();
  });
}

export function track(event: string, props?: AnalyticsProps) {
  if (!hasRealKey()) return;
  if (!ready || !client) {
    pendingEvents.push({ event, props });
    return;
  }
  client.capture(event, props);
}

/**
 * Manual exception capture (router error UI, caught failures).
 * Queues until init finishes so early boot errors aren't dropped.
 */
export function captureError(error: unknown, props?: AnalyticsProps) {
  if (!hasRealKey()) return;
  if (!ready || !client) {
    pendingExceptions.push({ error, props });
    return;
  }
  client.captureException(error, props);
}

/** Where the next `/play` board came from — set before navigate / restart. */
export function setPlayVia(via: PlayVia) {
  try {
    sessionStorage.setItem(PLAY_VIA_KEY, via);
  } catch {
    /* private mode */
  }
}

export function consumePlayVia(): PlayVia {
  try {
    const raw = sessionStorage.getItem(PLAY_VIA_KEY);
    sessionStorage.removeItem(PLAY_VIA_KEY);
    if (raw === "results" || raw === "howto" || raw === "restart" || raw === "lobby") return raw;
  } catch {
    /* private mode */
  }
  return "lobby";
}

/** 1-based runs in this browser tab session (PostHog `$session_id` still owns sessions). */
export function nextSessionRun(): number {
  try {
    const n = Number(sessionStorage.getItem(SESSION_RUN_KEY) ?? "0") + 1;
    sessionStorage.setItem(SESSION_RUN_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

export function peekSessionRun(): number {
  try {
    const n = Number(sessionStorage.getItem(SESSION_RUN_KEY) ?? "0");
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Shared lobby launch shape for `game_started` / `game_completed`. */
export function launchAnalyticsProps(launch: {
  mode: string;
  grid: number;
  topology?: string;
  minWordLength?: number;
  difficulty?: string;
  duration?: number;
}): AnalyticsProps {
  const props: AnalyticsProps = {
    mode: launch.mode,
    grid: launch.grid,
    topology: launch.topology ?? "square",
    min_word_length: launch.minWordLength ?? 3,
  };
  if (launch.mode === "timed") {
    props.duration = launch.duration ?? 60;
  } else {
    props.difficulty = launch.difficulty ?? "easy";
  }
  return props;
}

export function trackOptionsPrefChanged(pref: string, value: string) {
  track("options_pref_changed", { pref, value });
}

let lastRejectAt = 0;

/** Throttle reject spam — at most one `word_rejected` per 2s. */
export function trackWordRejected(reason: string) {
  const now = Date.now();
  if (now - lastRejectAt < 2000) return;
  lastRejectAt = now;
  track("word_rejected", { reason });
}
