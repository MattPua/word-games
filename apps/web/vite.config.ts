import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_URL,
  DEFAULT_TITLE,
  DESCRIPTION,
  OG_DESCRIPTION,
  OG_IMAGE,
  PRODUCT_NAME,
  jsonLd,
} from "./src/seo";
import { lucideReactImportOptimizer } from "./vite.lucide-optimize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const nativewindRoot = path.dirname(require.resolve("nativewind/package.json"));
const rnWebRoot = path.dirname(require.resolve("react-native-web/package.json"));
const lucideEsmRoot = path.dirname(
  require.resolve("lucide-react/dist/esm/createLucideIcon.mjs"),
);
const lucideIconsRoot = path.dirname(
  require.resolve("lucide-react/dist/esm/icons/sofa.mjs"),
);

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
    react({
      babel: {
        plugins: [
          [
            "@babel/plugin-transform-react-jsx",
            {
              runtime: "automatic",
              importSource: "nativewind",
            },
          ],
        ],
      },
      jsxImportSource: "nativewind",
    }),
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
         * Route JS, heavy sprites, and BGM cache on first use (CacheFirst) so a
         * lobby-only visit doesn’t pull Play/dict/medals/audio up front.
         */
        globPatterns: [
          "**/*.{css,html,woff2,ico,svg}",
          "logo.png",
          "favicon.png",
          "apple-touch-icon.png",
        ],
        globIgnores: ["**/menu-bgm.mp3", "**/og.png", "**/*jersey*"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/assets/") && /\.js$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "cp-js",
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24 * 30,
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
    global: "globalThis",
    __DEV__: JSON.stringify(mode !== "production"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Absolute paths so packages/ui (outside app) resolves correctly after Expo added real RN
      "react-native": rnWebRoot,
      nativewind: nativewindRoot,
      "@couch-potato/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@couch-potato/game-engine": path.resolve(__dirname, "../../packages/game-engine/src"),
      "@couch-potato/dictionary": path.resolve(__dirname, "../../packages/dictionary/src"),
      // lucide has no package exports for icons/* / helpers — alias for the optimizer (#1944)
      "lucide-react/icons": lucideIconsRoot,
      "lucide-react/createLucideIcon": path.join(
        lucideEsmRoot,
        "createLucideIcon.mjs",
      ),
      "lucide-react/Icon": path.join(lucideEsmRoot, "Icon.mjs"),
    },
    dedupe: ["react", "react-dom"],
    extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".web.js", ".js", ".mjs"],
  },
  optimizeDeps: {
    include: ["react-native-web", "nativewind"],
    // Don't prebundle the lucide barrel — optimizer rewrites to per-icon paths.
    exclude: ["lucide-react"],
    esbuildOptions: {
      loader: { ".js": "jsx" },
      resolveExtensions: [".web.js", ".js", ".mjs", ".ts", ".tsx"],
    },
  },
  server: { port: 5173 },
}));
