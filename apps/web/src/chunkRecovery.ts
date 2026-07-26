import { captureError } from "./analytics";

const RELOAD_KEY = "cp_stale_chunk_reload";

/** Deploy left this tab on old hashed imports — classic Vite/SPA 404 on dynamic import. */
export function isStaleChunkError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed/i.test(
    msg,
  );
}

/**
 * Report then hard-reload once so the shell picks up the new deploy.
 * Returns true when a reload was scheduled (caller should not paint a dead end).
 * Second hit in the same tab (reload didn’t help) reports `recovered: gave_up` and returns false.
 */
export function recoverFromStaleChunk(error: unknown, props?: Record<string, string>): boolean {
  if (!isStaleChunkError(error) || typeof window === "undefined") return false;

  let alreadyTried = false;
  try {
    alreadyTried = sessionStorage.getItem(RELOAD_KEY) === "1";
  } catch {
    /* private mode */
  }

  if (alreadyTried) {
    if (!gaveUpReported) {
      gaveUpReported = true;
      captureError(error, {
        surface: "stale_chunk",
        recovered: "gave_up",
        ...props,
      });
    }
    return false;
  }

  captureError(error, {
    surface: "stale_chunk",
    recovered: "reload",
    ...props,
  });

  try {
    sessionStorage.setItem(RELOAD_KEY, "1");
  } catch {
    /* private mode — still attempt reload */
  }
  window.location.reload();
  return true;
}

let gaveUpReported = false;

/** Clear the one-shot guard after a healthy boot (so a later deploy can recover again). */
export function clearStaleChunkReloadGuard() {
  gaveUpReported = false;
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* private mode */
  }
}
