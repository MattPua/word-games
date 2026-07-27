/**
 * Live Web Audio SFX engine — one shared context, recipe layers, soft envelopes.
 * Inspired by cuelume’s approach (no sample files); owned by Couch Potato.
 */

import { loadDevicePrefs } from "../storage";
import { RECIPES, isSoundName, type Layer, type NoiseLayer, type Recipe, type Shimmer, type SoundName, type ToneLayer } from "./recipes";

const SOURCE_STOP_PADDING = 0.05;
const CLEANUP_MARGIN = 0.05;
const INAUDIBLE_GAIN = 0.001;

let sharedContext: AudioContext | null = null;
let enabled = true;

export function setEnabled(value: boolean): void {
  enabled = value;
}

export function isEnabled(): boolean {
  return enabled;
}

export function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext;
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedContext = new Ctor();
  } catch {
    return null;
  }
  return sharedContext;
}

function renderTone(context: AudioContext, destination: AudioNode, layer: ToneLayer, startTime: number): void {
  const oscillator = context.createOscillator();
  oscillator.type = layer.waveform;
  oscillator.frequency.setValueAtTime(layer.frequency, startTime);
  if (layer.detune) oscillator.detune.value = layer.detune;
  if (layer.glideTo !== undefined) {
    const glideTime = layer.glideTime ?? layer.attack + layer.decay;
    oscillator.frequency.exponentialRampToValueAtTime(layer.glideTo, startTime + glideTime);
  }
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + layer.attack + layer.decay);
  oscillator.connect(gain).connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING);
}

function renderNoise(context: AudioContext, destination: AudioNode, layer: NoiseLayer, startTime: number): void {
  const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING;
  const length = Math.max(1, Math.floor(duration * context.sampleRate));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = 2 * Math.random() - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = layer.filterType;
  filter.frequency.value = layer.filterFrequency;
  if (layer.filterQ !== undefined) filter.Q.value = layer.filterQ;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + layer.attack + layer.decay);
  source.connect(filter).connect(gain).connect(destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

function attachShimmer(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  shimmer: Shimmer,
): AudioNode[] {
  const delay = context.createDelay(1);
  delay.delayTime.value = shimmer.delay;
  const feedbackFilter = context.createBiquadFilter();
  feedbackFilter.type = "lowpass";
  feedbackFilter.frequency.value = shimmer.lowpass;
  const feedbackGain = context.createGain();
  feedbackGain.gain.value = shimmer.feedback;
  const wetGain = context.createGain();
  wetGain.gain.value = shimmer.wet;
  source.connect(delay);
  delay.connect(feedbackFilter);
  feedbackFilter.connect(feedbackGain);
  feedbackGain.connect(delay);
  feedbackFilter.connect(wetGain);
  wetGain.connect(destination);
  return [delay, feedbackFilter, feedbackGain, wetGain];
}

function sourceEnd(recipe: Recipe): number {
  return Math.max(
    ...recipe.layers.map((layer: Layer) => (layer.offset ?? 0) + layer.attack + layer.decay + SOURCE_STOP_PADDING),
  );
}

function shimmerTail(shimmer: Shimmer | undefined): number {
  if (!shimmer || shimmer.feedback <= 0) return 0;
  if (shimmer.feedback >= 1) return shimmer.delay;
  return shimmer.delay * (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)));
}

function renderRecipe(context: AudioContext, recipe: Recipe): void {
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.value = recipe.masterGain;
  master.connect(context.destination);
  const shimmerNodes = recipe.shimmer ? attachShimmer(context, master, context.destination, recipe.shimmer) : [];
  for (const layer of recipe.layers) {
    const startTime = now + (layer.offset ?? 0);
    if (layer.kind === "tone") renderTone(context, master, layer, startTime);
    else renderNoise(context, master, layer, startTime);
  }
  const cleanupAfterMs = (sourceEnd(recipe) + shimmerTail(recipe.shimmer) + CLEANUP_MARGIN) * 1000;
  window.setTimeout(() => {
    master.disconnect();
    for (const node of shimmerNodes) node.disconnect();
  }, cleanupAfterMs);
}

function canPlay(): boolean {
  if (typeof window === "undefined") return false;
  if (!enabled) return false;
  // Prefs are source of truth (how-to may never call setEnabled this session).
  if (!loadDevicePrefs().soundEnabled) return false;
  if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false) return false;
  return true;
}

function withRunningContext(run: (context: AudioContext) => void): void {
  if (!canPlay()) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "running") {
    run(context);
    return;
  }
  try {
    void context.resume().then(() => {
      if (enabled && context.state === "running") run(context);
    }, () => {});
  } catch {
    // autoplay blocked
  }
}

/** Play a named recipe. Safe no-op when muted / SSR / blocked. */
export function play(sound: SoundName): void {
  if (!isSoundName(sound)) return;
  withRunningContext((context) => renderRecipe(context, RECIPES[sound]));
}

/**
 * One clear pitched note (path-select do–re–mi). Triangle + soft octave so
 * the scale interval reads on phone speakers — not a clicky sine tick.
 */
export function playScaleNote(frequency: number, peak = 0.07): void {
  withRunningContext((context) => {
    const now = context.currentTime;
    const attack = 0.01;
    const decay = 0.16;
    const master = context.createGain();
    master.gain.value = 1;
    master.connect(context.destination);

    const voice = (freq: number, level: number, type: OscillatorType) => {
      const osc = context.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak * level, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + decay + SOURCE_STOP_PADDING);
    };

    // Fundamental + quiet octave — reads as a real note, not a UI tick.
    voice(frequency, 1, "triangle");
    voice(frequency * 2, 0.22, "sine");

    window.setTimeout(() => master.disconnect(), (decay + SOURCE_STOP_PADDING + CLEANUP_MARGIN) * 1000);
  });
}

/**
 * One soft sine pluck at `frequency` Hz.
 * Shares the same mute gate + AudioContext as named recipes.
 */
export function playTone(frequency: number, peak = 0.05, decay = 0.09): void {
  withRunningContext((context) => {
    const now = context.currentTime;
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(context.destination);
    osc.start(now);
    osc.stop(now + decay + SOURCE_STOP_PADDING);
  });
}

export type { SoundName };
