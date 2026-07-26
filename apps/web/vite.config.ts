import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_URL,
  DEFAULT_TITLE,
  DESCRIPTION,
  OG_DESCRIPTION,
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  PRODUCT_NAME,
  jsonLd,
} from "./src/seo";
import { lucideReactImportOptimizer } from "./vite.lucide-optimize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const lucideEsmRoot = path.dirname(require.resolve("lucide-react/dist/esm/createLucideIcon.mjs"));
const lucideIconsRoot = path.dirname(require.resolve("lucide-react/dist/esm/icons/sofa.mjs"));

/** Personal API key + project id → upload source maps (Error tracking). Skip when unset. */
const posthogPersonalKey = process.env.POSTHOG_PERSONAL_API_KEY;
const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
const posthogEnvReady = Boolean(posthogPersonalKey && posthogProjectId);
const posthogHost = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Bun nests `@posthog/cli` where path auto-detect often misses `posthog-cli`.
 * Resolve the Node entry ourselves.
 */
function resolvePosthogCliBinary(): string | null {
  try {
    return require.resolve("@posthog/cli/run-posthog-cli.js");
  } catch {
    try {
      const pkg = path.dirname(require.resolve("@posthog/cli/package.json"));
      return path.join(pkg, "run-posthog-cli.js");
    } catch {
      return null;
    }
  }
}

const posthogCliBinary = posthogEnvReady ? resolvePosthogCliBinary() : null;
const uploadPosthogSourcemaps = posthogEnvReady && Boolean(posthogCliBinary);
if (posthogEnvReady && !posthogCliBinary) {
  console.warn(
    "[vite] POSTHOG_* set but @posthog/cli not found — building without source map upload",
  );
}

/**
 * Soft-fail sourcemap upload — never take down a production deploy for analytics.
 * Uses `posthog-cli --no-fail` so API/key errors exit 0; still catch spawn failures.
 */
function posthogSourcemapsPlugin(): Plugin | null {
  if (!uploadPosthogSourcemaps || !posthogCliBinary) return null;
  const cli = posthogCliBinary;
  const apiKey = posthogPersonalKey!;
  const projectId = posthogProjectId!;
  return {
    name: "couch-potato-posthog-sourcemaps",
    apply: "build",
    async closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      await new Promise<void>((resolve) => {
        const child = spawn(
          process.execPath,
          [cli, "--no-fail", "sourcemap", "process", "--directory", dist, "--delete-after"],
          {
            stdio: "inherit",
            env: {
              ...process.env,
              POSTHOG_CLI_API_KEY: apiKey,
              POSTHOG_CLI_PROJECT_ID: projectId,
              POSTHOG_CLI_HOST: posthogHost,
            },
          },
        );
        child.on("error", (err) => {
          console.warn("[vite] PostHog sourcemap upload failed to start:", err);
          resolve();
        });
        child.on("exit", (code) => {
          if (code != null && code !== 0) {
            console.warn(
              `[vite] PostHog sourcemap upload exited ${code} (deploy continues)`,
            );
          }
          resolve();
        });
      });
    },
  };
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Inject `src/seo.ts` strings into index.html placeholders (cold-load defaults). */
function seoHtmlPlugin(): Plugin {
  const replacements: Record<string, string> = {
    __SEO_DEFAULT_TITLE__: escapeAttr(DEFAULT_TITLE),
    __SEO_DESCRIPTION__: escapeAttr(DESCRIPTION),
    __SEO_CANONICAL__: escapeAttr(CANONICAL_URL),
    __SEO_PRODUCT_NAME__: escapeAttr(PRODUCT_NAME),
    __SEO_OG_DESCRIPTION__: escapeAttr(OG_DESCRIPTION),
    __SEO_OG_IMAGE__: escapeAttr(OG_IMAGE),
    __SEO_OG_IMAGE_WIDTH__: String(OG_IMAGE_WIDTH),
    __SEO_OG_IMAGE_HEIGHT__: String(OG_IMAGE_HEIGHT),
    __SEO_JSON_LD__: JSON.stringify(jsonLd(), null, 2),
  };

  return {
    name: "couch-potato-seo-html",
    transformIndexHtml(html) {
      let out = html;
      for (const [token, value] of Object.entries(replacements)) {
        out = out.replaceAll(token, value);
      }
      return out;
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    seoHtmlPlugin(),
    /** Per-icon lucide imports — avoid Vite crawling the whole barrel (#1944). */
    lucideReactImportOptimizer(),
    react(),
    posthogSourcemapsPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "robots.txt", "logo.png"],
      manifest: {
        name: PRODUCT_NAME,
        short_name: "Couch Potato",
        description: DESCRIPTION,
        theme_color: "#859075",
        background_color: "#f4f1ea",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        lang: "en",
        categories: ["games", "entertainment"],
        icons: [
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        /**
         * Lean precache for 3G: shell + latin fonts + tiny brand marks.
         * Route JS uses NetworkFirst (fresh deploys); images/BGM CacheFirst on
         * first use so a lobby-only visit doesn’t pull Play/dict/medals/audio.
         */
        globPatterns: [
          "**/*.{css,html,woff2,ico,svg}",
          "logo.png",
          "logo-mark.webp",
          "favicon.png",
          "apple-touch-icon.png",
        ],
        globIgnores: ["**/menu-bgm.mp3", "**/og.png", "**/*jersey*"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            /**
             * Hashed `/assets/*.js` — NetworkFirst so a new deploy isn’t masked by a
             * 30-day CacheFirst hit on an old main that imports deleted chunks.
             * Short network timeout → cache for offline play after first visit.
             */
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/assets/") && /\.js$/i.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "cp-js",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              /\.(?:png|webp)$/i.test(url.pathname) && !url.pathname.endsWith("/og.png"),
            handler: "CacheFirst",
            options: {
              cacheName: "cp-images",
              expiration: {
                maxEntries: 48,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => /\.mp3$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "cp-audio",
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  define: {
    __DEV__: JSON.stringify(mode !== "production"),
  },
  build: {
    // Needed for PostHog Error tracking stack traces when upload env is set.
    sourcemap: uploadPosthogSourcemaps,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@couch-potato/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@couch-potato/game-engine": path.resolve(__dirname, "../../packages/game-engine/src"),
      "@couch-potato/dictionary": path.resolve(__dirname, "../../packages/dictionary/src"),
      // lucide has no package exports for icons/* / helpers — alias for the optimizer (#1944)
      "lucide-react/icons": lucideIconsRoot,
      "lucide-react/createLucideIcon": path.join(lucideEsmRoot, "createLucideIcon.mjs"),
      "lucide-react/Icon": path.join(lucideEsmRoot, "Icon.mjs"),
    },
    dedupe: ["react", "react-dom"],
    // Prefer *.native only on Metro; web defaults are unsuffixed DOM files.
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"],
  },
  optimizeDeps: {
    // Don't prebundle the lucide barrel — optimizer rewrites to per-icon paths.
    exclude: ["lucide-react"],
  },
  server: { port: 5173 },
}));
