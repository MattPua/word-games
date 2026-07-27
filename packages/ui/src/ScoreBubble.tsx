import type { HTMLAttributes } from "react";

export type ScoreBubbleProps = {
  word: string;
  hint?: string;
  className?: string;
  /**
   * Brief nab celebration on the pill (accept flash with WORD +N).
   * Live swipe stays letters-only — only pass while flashing an accept.
   */
  nabPop?: boolean;
  /** Accepted word length — heats the pop (3 quiet → 6+ loud). */
  nabLength?: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** Sage word pill for the live swipe word — DOM on web (no RN on how-to/play cold path). */
export function ScoreBubble({
  word,
  hint = "Swipe letters",
  className = "",
  nabPop = false,
  nabLength = 0,
  ...rest
}: ScoreBubbleProps) {
  const show = word.trim().length > 0;
  const heat =
    nabPop && nabLength >= 6
      ? "cp-word-pill-hot"
      : nabPop && nabLength >= 5
        ? "cp-word-pill-warm"
        : "";
  return (
    <div className={`relative flex items-center justify-center ${className}`} {...rest}>
      <div
        className={`cp-word-pill w-full max-w-sm ${show ? "" : "cp-word-pill-empty"} ${nabPop ? "cp-word-pill-pop" : ""} ${heat}`}
      >
        <p
          className={`text-center leading-none tracking-normal ${
            show
              ? "text-3xl font-bold text-primary-foreground"
              : "text-base font-medium text-muted-foreground"
          }`}
        >
          {show ? word : hint}
        </p>
      </div>
    </div>
  );
}
