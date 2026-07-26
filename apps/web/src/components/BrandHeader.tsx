import type { ReactNode } from "react";
import { Logo } from "@couch-potato/ui";
import { cn } from "@/lib/utils";

export type BrandHeaderProps = {
  /** Mascot mark — default chill `Logo`. Page-specific poses welcome (Options gear, medals, etc.). */
  mark?: ReactNode;
  /** Page label under the product name (Options, Couch medals…). Omit on lobby. */
  title?: string;
  /** Optional blurb — lobby tagline, medals count, etc. Not required. */
  description?: string;
  /**
   * Lobby only: product name is the page `<h1>`.
   * Elsewhere: product name is a wordmark; `title` (when set) is the `<h1>`.
   */
  brandHeading?: boolean;
  className?: string;
  markClassName?: string;
};

/**
 * Chrome brand lockup — always **Couch Potato** + mascot.
 * Descriptions stay optional; page titles sit under the wordmark.
 */
export function BrandHeader({
  mark,
  title,
  description,
  brandHeading = false,
  className = "",
  markClassName = "",
}: BrandHeaderProps) {
  const markNode = mark ?? <Logo size={72} />;

  return (
    <header className={cn("cp-lobby-brand", className)}>
      <div className={cn("shrink-0", markClassName)}>{markNode}</div>
      <div className="cp-lobby-brand-copy">
        {brandHeading ? (
          <h1 className="cp-display">Couch Potato</h1>
        ) : (
          <p className="cp-display text-2xl text-foreground">Couch Potato</p>
        )}
        {title ? (
          brandHeading ? (
            <p className="mt-0.5 font-display text-base font-bold text-muted-foreground">{title}</p>
          ) : (
            <h1 className="mt-0.5 font-display text-xl font-bold text-foreground">{title}</h1>
          )
        ) : null}
        {description ? <p className="cp-lobby-tagline">{description}</p> : null}
      </div>
    </header>
  );
}
