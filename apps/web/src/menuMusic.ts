/** Lobby / crew / play looping jam — separate from cuelume SFX. */

const SRC = "/audio/menu-bgm.mp3";
const VOLUME_LOBBY = 0.35;
/** Quieter under play SFX so jam stays bed, not lead. */
const VOLUME_PLAY = 0.12;
const FADE_MS = 450;

export type MenuMusicScene = "off" | "lobby" | "play";

let audio: HTMLAudioElement | null = null;
let enabled = true;
let scene: MenuMusicScene = "off";
let gestureHooked = false;
let fadeTimer: number | null = null;
/** Bumps when a newer sync supersedes an in-flight play()/fade. */
let syncGen = 0;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME_LOBBY;
  }
  return audio;
}

function volumeFor(s: MenuMusicScene): number {
  if (s === "play") return VOLUME_PLAY;
  if (s === "lobby") return VOLUME_LOBBY;
  return 0;
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
  if (Math.abs(start - target) < 0.005) {
    el.volume = target;
    then?.();
    return;
  }
  const t0 = performance.now();
  const gen = syncGen;
  fadeTimer = window.setInterval(() => {
    if (gen !== syncGen) {
      clearFade();
      return;
    }
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
  const gen = ++syncGen;
  const shouldPlay = enabled && scene !== "off";
  const targetVol = volumeFor(scene);

  if (shouldPlay) {
    if (el.paused) {
      clearFade();
      el.volume = 0;
      const p = el.play();
      if (p !== undefined) {
        void p
          .then(() => {
            if (gen !== syncGen) return;
            fadeTo(targetVol);
          })
          .catch(() => {
            if (gen !== syncGen) return;
            hookGestureUnlock();
          });
      } else {
        fadeTo(targetVol);
      }
    } else {
      fadeTo(targetVol);
    }
  } else if (!el.paused) {
    fadeTo(0, () => {
      if (gen !== syncGen) return;
      el.pause();
      el.currentTime = 0;
      el.volume = VOLUME_LOBBY;
    });
  }
}

/** Pref: lobby jam on/off (persisted separately from SFX). */
export function applyMenuMusicEnabled(next: boolean) {
  enabled = next;
  syncPlayback();
}

/** Lobby / play bed / off (results). Volume fades when scene changes. */
export function setMenuMusicScene(next: MenuMusicScene) {
  scene = next;
  syncPlayback();
}

export function menuMusicSceneForPath(pathname: string): MenuMusicScene {
  if (pathname === "/" || pathname === "/profiles") return "lobby";
  if (pathname === "/play") return "play";
  return "off";
}

/** Test / debug probe (detached Audio isn’t in the DOM). */
export function getMenuMusicSnapshot() {
  return {
    enabled,
    scene,
    paused: audio?.paused ?? true,
    volume: audio?.volume ?? 0,
    currentTime: audio?.currentTime ?? 0,
  };
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __cpMenuMusic?: typeof getMenuMusicSnapshot }).__cpMenuMusic =
    getMenuMusicSnapshot;
}
