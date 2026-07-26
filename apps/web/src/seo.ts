/** Authoritative SEO / share copy. Cold-load HTML is filled via Vite transformIndexHtml. */

export const PRODUCT_NAME = "Couch Potato";

export const DEFAULT_TITLE = "Couch Potato: swipe letters, find words";

export const DESCRIPTION =
  "Swipe letters on a grid to spell words. Hit a score target, race a timer, or earn more time with each word you find. Free, no ads, play as much as you want.";

/** OG / Twitter blurb (shorter than meta description). */
export const OG_DESCRIPTION =
  "Swipe letters to spell words. Free, no ads. Play as much as you want.";

export const CANONICAL_ORIGIN = "https://www.acouchpotato.com";
export const CANONICAL_URL = `${CANONICAL_ORIGIN}/`;

/** Absolute URL — crawlers reject relative og:image paths. */
export const OG_IMAGE = `${CANONICAL_ORIGIN}/og.png`;
export const OG_IMAGE_WIDTH = 256;
export const OG_IMAGE_HEIGHT = 256;

export const JSON_LD_DESCRIPTION =
  "Swipe adjacent letters on a square or honeycomb grid to spell words. Free, no ads. Play as much as you want.";

export function pageTitle(label: string): string {
  return `${label} · ${PRODUCT_NAME}`;
}

/** TanStack Router `head` helper: document title for a screen. */
export function pageHead(label: string) {
  return {
    meta: [{ title: pageTitle(label) }],
  };
}

export function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "VideoGame"],
    name: PRODUCT_NAME,
    url: CANONICAL_URL,
    description: JSON_LD_DESCRIPTION,
    applicationCategory: "GameApplication",
    genre: "Word game",
    image: OG_IMAGE,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
