import uiPreset from "@couch-potato/ui/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,tsx}",
    "../../packages/ui/src/**/*.{js,ts,tsx}",
    "!../../packages/ui/src/**/*.native.{js,ts,tsx}",
  ],
  presets: [uiPreset],
  plugins: [],
};
