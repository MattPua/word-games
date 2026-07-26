import { describe, expect, it } from "vitest";
import { formatRelativeTime, formatUnlockDate, formatWhen } from "./relativeTime";

const FIXED_NOW = Date.UTC(2026, 6, 25, 15, 0, 0); // Jul 25, 2026

describe("formatRelativeTime", () => {
  const now = FIXED_NOW;

  it("says just now for sub-minute", () => {
    expect(formatRelativeTime(now, now)).toBe("just now");
    expect(formatRelativeTime(now - 10_000, now)).toBe("just now");
  });

  it("uses RelativeTimeFormat auto (hours / yesterday)", () => {
    expect(formatRelativeTime(now - 2 * 60 * 60_000, now)).toBe("2 hours ago");
    expect(formatRelativeTime(now - 86_400_000, now)).toBe("yesterday");
    expect(formatRelativeTime(now - 3 * 86_400_000, now)).toBe("3 days ago");
  });
});

describe("formatWhen", () => {
  const now = FIXED_NOW;

  it("parses ISO into the same relative labels", () => {
    expect(formatWhen(new Date(now).toISOString(), now)).toBe("just now");
    expect(formatWhen(new Date(now - 3 * 60_000).toISOString(), now)).toBe("3 minutes ago");
  });

  it("falls back for empty / junk", () => {
    expect(formatWhen("")).toBe("sometime on the couch");
    expect(formatWhen("not-a-date")).toBe("not-a-date");
  });
});

describe("formatUnlockDate", () => {
  const now = FIXED_NOW;

  it("prefixes Unlocked", () => {
    expect(formatUnlockDate(now, now)).toBe("Unlocked just now");
    expect(formatUnlockDate(now - 3 * 60_000, now)).toBe("Unlocked 3 minutes ago");
    expect(formatUnlockDate(now - 86_400_000, now)).toBe("Unlocked yesterday");
  });
});
