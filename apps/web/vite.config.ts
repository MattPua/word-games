import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

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
      "react-native": "react-native-web",
      "@couch-potato/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@couch-potato/game-engine": path.resolve(
        __dirname,
        "../../packages/game-engine/src",
      ),
      "@couch-potato/dictionary": path.resolve(
        __dirname,
        "../../packages/dictionary/src",
      ),
    },
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
