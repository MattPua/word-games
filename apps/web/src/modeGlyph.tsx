/** Lobby + Play HUD mode marks (Goal / Timed / Survival). */

export type ModeGlyphId = "target" | "timed" | "survival";

export function ModeGlyph({
  mode,
  className = "h-9 w-9",
}: {
  mode: ModeGlyphId;
  className?: string;
}) {
  if (mode === "timed") {
    return (
      <svg
        viewBox="0 0 40 40"
        className={`cp-mode-glyph cp-mode-glyph-timed ${className}`.trim()}
        aria-hidden
      >
        <circle cx="20" cy="22" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M16 7h8M20 7v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hour (short) + minute (long) — separate so the minute hand can really sweep. */}
        <path
          className="cp-mode-hand cp-mode-hand-hour"
          d="M20 22l4.5 3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className="cp-mode-hand cp-mode-hand-minute"
          d="M20 22v-8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (mode === "survival") {
    return (
      <svg
        viewBox="0 0 40 40"
        className={`cp-mode-glyph cp-mode-glyph-survival ${className}`.trim()}
        aria-hidden
      >
        <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path
          className="cp-mode-pulse"
          d="M12 20h3.5l2-5.5 3 11 2.5-7.5h4.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 40 40"
      className={`cp-mode-glyph cp-mode-glyph-target ${className}`.trim()}
      aria-hidden
    >
      {/* Depleting gauge — Goal is clear-the-score, not a bullseye. */}
      <circle
        className="cp-mode-gauge-track"
        cx="20"
        cy="20"
        r="12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        opacity="0.22"
      />
      <circle
        className="cp-mode-gauge-arc"
        cx="20"
        cy="20"
        r="12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeDasharray="48 79"
        transform="rotate(-90 20 20)"
      />
      <path
        className="cp-mode-gauge-zero"
        d="M20 15.5v9M16.5 21.5 20 25l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
