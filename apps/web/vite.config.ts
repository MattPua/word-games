import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const nativewindRoot = path.dirname(require.resolve("nativewind/package.json"));
const rnWebRoot = path.dirname(require.resolve("react-native-web/package.json"));

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

export default defineConfig({
  plugins: [
    seoHtmlPlugin(),
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
  ],
  define: {
    global: "globalThis",
    __DEV__: JSON.stringify(true),
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
    },
    dedupe: ["react", "react-dom"],
    extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".web.js", ".js"],
  },
  optimizeDeps: {
    include: ["react-native-web", "nativewind"],
    esbuildOptions: {
      loader: { ".js": "jsx" },
      resolveExtensions: [".web.js", ".js", ".ts", ".tsx"],
    },
  },
  server: { port: 5173 },
});
