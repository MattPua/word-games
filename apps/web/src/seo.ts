/** Authoritative SEO / share copy. Cold-load HTML is filled via Vite transformIndexHtml. */

export const PRODUCT_NAME = "Couch Potato";

export const DEFAULT_TITLE = "Couch Potato: swipe letters, find words";

export const DESCRIPTION =
  "Couch Potato is a casual word game: swipe adjacent letters on a grid, clear a goal, sprint a timed haul, or keep survival fed.";

/** OG / Twitter blurb (shorter than meta description). */
export const OG_DESCRIPTION = "Swipe adjacent letters. Short sessions. No hints. Just couch vibes.";

export const CANONICAL_ORIGIN = "https://acouchpotato.com";
export const CANONICAL_URL = `${CANONICAL_ORIGIN}/`;

export const OG_IMAGE = "/og.png";

export const JSON_LD_DESCRIPTION = "Casual swipe-to-spell word game on a letter grid.";

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
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
