import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const nativewindRoot = path.dirname(require.resolve("nativewind/package.json"));
const rnWebRoot = path.dirname(require.resolve("react-native-web/package.json"));

export default defineConfig({
  plugins: [
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
