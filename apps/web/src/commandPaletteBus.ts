/** Shared bus + platform label for ⌘K / Ctrl+K palette chrome. */

export const COMMAND_PALETTE_OPEN = "cp:open-command-palette";

/** Set when open is requested before CommandPalette has mounted (lazy load). */
let wantOpen = false;

export function markCommandPaletteWantOpen() {
  wantOpen = true;
}

export function consumeCommandPaletteWantOpen(): boolean {
  const v = wantOpen;
  wantOpen = false;
  return v;
}

export function openCommandPalette() {
  markCommandPaletteWantOpen();
  window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN));
}

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

/** Player-facing shortcut string (Mac ⌘K, else Ctrl+K). */
export function modKLabel(): string {
  return isApplePlatform() ? "⌘K" : "Ctrl+K";
}
