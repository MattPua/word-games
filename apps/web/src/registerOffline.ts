/** Register the production service worker (vite-plugin-pwa). No-op in Vite HMR. */

export function registerOfflineShell() {
  if (!import.meta.env.PROD) return;
  void import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisteredSW(swUrl, registration) {
          if (import.meta.env.DEV) {
            console.info("[cp] service worker registered", swUrl, registration?.scope);
          }
        },
      });
    })
    .catch(() => {
      // Offline shell is best-effort — never block boot.
    });
}
