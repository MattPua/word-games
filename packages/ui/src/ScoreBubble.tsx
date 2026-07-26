import type { HTMLAttributes } from "react";

export type ScoreBubbleProps = {
  word: string;
  hint?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** Sage word pill for the live swipe word — DOM on web (no RN on how-to/play cold path). */
export function ScoreBubble({
  word,
  hint = "Swipe letters",
  className = "",
  ...rest
}: ScoreBubbleProps) {
  const show = word.trim().length > 0;
  return (
    <div className={`relative flex items-center justify-center ${className}`} {...rest}>
      <div className={`cp-word-pill w-full max-w-sm ${show ? "" : "cp-word-pill-empty"}`}>
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
