/** Shared bus for the About credits modal (chrome nav + ⌘K). */

export const ABOUT_OPEN = "cp:open-about";

let wantOpen = false;

export function markAboutWantOpen() {
  wantOpen = true;
}

export function consumeAboutWantOpen(): boolean {
  const v = wantOpen;
  wantOpen = false;
  return v;
}

export function openAbout() {
  markAboutWantOpen();
  window.dispatchEvent(new Event(ABOUT_OPEN));
}
