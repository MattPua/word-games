import type { ReactNode } from "react";
import { PotatoSprite } from "./PotatoSprite";

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** Optional chrome (e.g. web shadcn Button) — keep actions out of this package. */
  children?: ReactNode;
  /**
   * Show the bored atlas mascot (not the chill brand `Logo`) — safe under
   * pages that already show `Logo` in the header (Couch crew / Potato Board).
   * Prefer `mark` for one-off poses (e.g. Results zero-haul `LogoConsolation`).
   */
  showLogo?: boolean;
  /** Bored mark size when `showLogo` (default 72). Ignored when `mark` is set. */
  logoSize?: number;
  /** Custom mark above the title (wins over `showLogo`). */
  mark?: ReactNode;
  className?: string;
};

/** Couch-casual empty — no scores, no words, lonely profiles. */
export function EmptyState({
  title,
  body,
  children,
  showLogo = false,
  logoSize = 72,
  mark,
  className = "",
}: EmptyStateProps) {
  const mascot = mark ?? (showLogo ? <PotatoSprite frame="bored" size={logoSize} /> : null);
  return (
    <div className={`flex flex-col items-center px-4 py-6 ${className}`}>
      {mascot}
      <p className={`text-center font-display text-xl text-foreground ${mascot ? "mt-3" : ""}`}>
        {title}
      </p>
      {body ? <p className="mt-1 text-center font-body text-muted-foreground">{body}</p> : null}
      {children ? <div className="mt-4 w-full">{children}</div> : null}
    </div>
  );
}
