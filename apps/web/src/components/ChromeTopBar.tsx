import { Logo } from "@couch-potato/ui";
import { useNavigate } from "@tanstack/react-router";
import { ChromeNav } from "@/components/ChromeNav";

type ChromeTopBarProps = {
  /** Hide nav icons (rare — e.g. how-to cold path). Brand still links home. */
  hideNav?: boolean;
  /**
   * Lobby: hero `BrandHeader` owns the brand — bar is nav-only so we don't
   * stack logo + wordmark twice (esp. desktop).
   */
  hideBrand?: boolean;
  className?: string;
};

/**
 * Site chrome bar — full chill logo + wordmark (left) | nav (right).
 * Lobby may pass `hideBrand` when the page hero already brands.
 */
export function ChromeTopBar({
  hideNav = false,
  hideBrand = false,
  className = "",
}: ChromeTopBarProps) {
  const navigate = useNavigate();

  return (
    <header
      className={`cp-chrome-top ${hideBrand ? "cp-chrome-top-nav-only" : ""} ${className}`.trim()}
    >
      {hideBrand ? null : (
        <button
          type="button"
          className="cp-chrome-brand"
          aria-label="Couch Potato, back to lobby"
          onClick={() => navigate({ to: "/" })}
        >
          <Logo size={36} className="shrink-0" />
          <span className="cp-chrome-brand-name">Couch Potato</span>
        </button>
      )}
      {hideNav ? null : <ChromeNav />}
    </header>
  );
}

type PageHeadingProps = {
  title: string;
  description?: string;
  className?: string;
};

/** Page H1 under the site bar — not stacked under a second wordmark. */
export function PageHeading({ title, description, className = "" }: PageHeadingProps) {
  return (
    <div className={`cp-page-heading ${className}`.trim()}>
      <h1 className="cp-page-title">{title}</h1>
      {description ? <p className="cp-page-lede">{description}</p> : null}
    </div>
  );
}
