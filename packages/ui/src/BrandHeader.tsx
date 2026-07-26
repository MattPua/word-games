import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { cn } from "./cn";

export type BrandHeaderProps = {
  /**
   * Brand mark — default full chill `Logo` (not a face crop).
   * Lobby passes a larger `Logo`; chrome pages use `ChromeTopBar` instead of this.
   */
  mark?: ReactNode;
  /** Page label under the product name. Omit on lobby. */
  title?: string;
  /** Optional blurb — lobby tagline, etc. */
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
 * Lobby / how-to-done hero lockup — centered mark + Couch Potato wordmark.
 * Lobby keeps this as the brand hero; site bar on `/` is nav-only (`hideBrand`)
 * so desktop doesn't stack two lockups. Chrome routes use `ChromeTopBar` +
 * `PageHeading` instead of this.
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
      <div className={cn("cp-lobby-brand-mark shrink-0", markClassName)}>{markNode}</div>
      <div className="cp-lobby-brand-copy">
        {brandHeading ? (
          <h1 className="cp-display cp-lobby-brand-name">Couch Potato</h1>
        ) : (
          <p className="cp-display cp-lobby-brand-name text-2xl text-foreground">Couch Potato</p>
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
