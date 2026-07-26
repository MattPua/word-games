const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const host =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

type PostHog = typeof import("posthog-js").default;

let client: PostHog | null = null;
let ready = false;

function hasRealKey(): boolean {
  return Boolean(key && key !== "phc_placeholder");
}

/** Init only when a real key is set — keeps posthog-js off the lobby cold chunk. */
export function initAnalytics() {
  if (!hasRealKey()) return;
  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key!, { api_host: host, person_profiles: "identified_only" });
    client = posthog;
    ready = true;
  });
}

export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  if (!ready || !client) return;
  client.capture(event, props);
}
