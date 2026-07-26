/** Dark mode + display font: toggle classes/attrs on `<html>` — tokens live in `theme.css`. */
import type { FontPreference, ThemePreference } from "./storage";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** `system` resolves to the live OS scheme; explicit prefs pass straight through. */
export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  return pref === "system" ? (systemPrefersDark() ? "dark" : "light") : pref;
}

export function applyTheme(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveTheme(pref) === "dark");
}

/** Flip the resolved theme to its opposite as an explicit override (player asked for a toggle, not just system). */
export function toggleTheme(pref: ThemePreference): "light" | "dark" {
  return resolveTheme(pref) === "dark" ? "light" : "dark";
}

/** Clean Lexend (default) vs pixel Jersey 15 for `--font-display` — see `theme.css` `data-font`. */
let jerseyLoaded = false;

function ensureJerseyFont() {
  if (jerseyLoaded) return;
  jerseyLoaded = true;
  void import("@fontsource/jersey-15/latin-400.css");
}

export function applyFontPreference(pref: FontPreference) {
  if (typeof document === "undefined") return;
  if (pref === "pixel") ensureJerseyFont();
  document.documentElement.dataset.font = pref;
}
