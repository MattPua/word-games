/** Lobby / crew screen looping jam — separate from cuelume SFX. */

const SRC = "/audio/menu-bgm.mp3";
const VOLUME = 0.35;
const FADE_MS = 400;

let audio: HTMLAudioElement | null = null;
let enabled = true;
let routeWants = false;
let gestureHooked = false;
let fadeTimer: number | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME;
  }
  return audio;
}

function clearFade() {
  if (fadeTimer != null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function hookGestureUnlock() {
  if (gestureHooked || typeof window === "undefined") return;
  gestureHooked = true;
  const unlock = () => {
    gestureHooked = false;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    syncPlayback();
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function fadeTo(target: number, then?: () => void) {
  const el = getAudio();
  clearFade();
  const start = el.volume;
  const t0 = performance.now();
  fadeTimer = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - t0) / FADE_MS);
    el.volume = start + (target - start) * t;
    if (t >= 1) {
      clearFade();
      el.volume = target;
      then?.();
    }
  }, 32);
}

function syncPlayback() {
  const el = getAudio();
  const shouldPlay = enabled && routeWants;
  if (shouldPlay) {
    clearFade();
    el.volume = VOLUME;
    const p = el.play();
    if (p !== undefined) {
      void p.catch(() => {
        hookGestureUnlock();
      });
    }
  } else if (!el.paused) {
    fadeTo(0, () => {
      el.pause();
      el.currentTime = 0;
      el.volume = VOLUME;
    });
  }
}

/** Pref: lobby jam on/off (persisted separately from SFX). */
export function applyMenuMusicEnabled(next: boolean) {
  enabled = next;
  syncPlayback();
}

/** True on lobby / couch crew — false on play (and results). */
export function setMenuMusicRouteActive(active: boolean) {
  routeWants = active;
  syncPlayback();
}

export function isMenuRoute(pathname: string): boolean {
  return pathname === "/" || pathname === "/profiles";
}
