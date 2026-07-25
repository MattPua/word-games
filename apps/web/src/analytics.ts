import posthog from "posthog-js";

const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const host =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

let ready = false;

export function initAnalytics() {
  if (!key || key === "phc_placeholder") return;
  posthog.init(key, { api_host: host, person_profiles: "identified_only" });
  ready = true;
}

export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  if (!ready) return;
  posthog.capture(event, props);
}
