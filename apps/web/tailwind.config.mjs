import nativewind from "nativewind/preset";
import uiPreset from "@couch-potato/ui/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}", "../../packages/ui/src/**/*.{js,ts,tsx}"],
  // uiPreset after nativewind so our fontFamily.sans replaces ui-sans-serif for preflight
  presets: [nativewind, uiPreset],
  plugins: [],
};
