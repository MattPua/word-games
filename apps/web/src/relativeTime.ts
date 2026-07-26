const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Relative past/future — "just now", "3 minutes ago", "yesterday".
 * One helper for Potato Board stamps, medal unlock lines, etc.
 */
export function formatRelativeTime(ms: number, now = Date.now()): string {
  const diffMs = ms - now;
  const absMs = Math.abs(diffMs);
  // Sub-minute: RelativeTimeFormat would say "0 minutes ago" / "this minute".
  if (absMs < 45_000) return "just now";

  const sec = Math.round(diffMs / 1000);
  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;
  if (absMs < 45 * 60_000) {
    value = Math.round(sec / 60);
    unit = "minute";
  } else if (absMs < 22 * 60 * 60_000) {
    value = Math.round(sec / 3600);
    unit = "hour";
  } else if (absMs < 30 * 24 * 60 * 60_000) {
    value = Math.round(sec / 86_400);
    unit = "day";
  } else if (absMs < 365 * 24 * 60 * 60_000) {
    value = Math.round(sec / (30 * 86_400));
    unit = "month";
  } else {
    value = Math.round(sec / (365 * 86_400));
    unit = "year";
  }

  return RELATIVE.format(value, unit);
}

/** ISO → relative (Potato Board bests / recent runs). */
export function formatWhen(iso: string, now = Date.now()): string {
  if (!iso) return "sometime on the couch";
  try {
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) return iso;
    return formatRelativeTime(ms, now);
  } catch {
    return iso;
  }
}

/** Game-voice unlock line — "Unlocked yesterday", "Unlocked 3 days ago". No em dashes. */
export function formatUnlockDate(ms: number, now = Date.now()): string {
  const label = formatRelativeTime(ms, now);
  return label === "just now" ? "Unlocked just now" : `Unlocked ${label}`;
}
