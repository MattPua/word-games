/**
 * Couch Potato SFX recipes — live Web Audio, no sample files.
 * Layered tones/noise + soft envelopes (+ optional shimmer), cuelume-style.
 * Only names we actually fire from the game loop.
 */

export type Waveform = OscillatorType;

export type ToneLayer = {
  kind: "tone";
  waveform: Waveform;
  frequency: number;
  offset?: number;
  attack: number;
  decay: number;
  peak: number;
  detune?: number;
  glideTo?: number;
  glideTime?: number;
};

export type NoiseLayer = {
  kind: "noise";
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterQ?: number;
  offset?: number;
  attack: number;
  decay: number;
  peak: number;
};

export type Layer = ToneLayer | NoiseLayer;

export type Shimmer = {
  delay: number;
  feedback: number;
  wet: number;
  lowpass: number;
};

export type Recipe = {
  masterGain: number;
  layers: Layer[];
  shimmer?: Shimmer;
};

export const RECIPES = {
  /** Quick four-note ascending twinkle (4+ accept ladder). */
  sparkle: {
    masterGain: 0.58,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1760, offset: 0, attack: 0.003, decay: 0.1, peak: 0.055 },
      { kind: "tone", waveform: "sine", frequency: 2217, offset: 0.04, attack: 0.003, decay: 0.1, peak: 0.048 },
      { kind: "tone", waveform: "sine", frequency: 2637, offset: 0.08, attack: 0.003, decay: 0.11, peak: 0.045 },
      { kind: "tone", waveform: "sine", frequency: 3520, offset: 0.12, attack: 0.003, decay: 0.14, peak: 0.04 },
    ],
    shimmer: { delay: 0.07, feedback: 0.38, wet: 0.26, lowpass: 6500 },
  },
  /** Warm detuned pad swell (6+ afterglow / wins). */
  bloom: {
    masterGain: 0.56,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 528, attack: 0.05, decay: 0.36, peak: 0.072 },
      { kind: "tone", waveform: "sine", frequency: 528, detune: 12, attack: 0.05, decay: 0.38, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 792, offset: 0.04, attack: 0.04, decay: 0.28, peak: 0.035 },
    ],
    shimmer: { delay: 0.15, feedback: 0.24, wet: 0.16, lowpass: 2800 },
  },
  /** Crisp bandpass tick + tiny sine ping. */
  tick: {
    masterGain: 0.45,
    layers: [
      {
        kind: "noise",
        filterType: "bandpass",
        filterFrequency: 5400,
        filterQ: 1.8,
        attack: 0.001,
        decay: 0.02,
        peak: 0.16,
      },
      { kind: "tone", waveform: "sine", frequency: 2600, attack: 0.001, decay: 0.014, peak: 0.022 },
    ],
  },
  /** Short three-note ascending confirm (A-major-ish) — 3-letter crumbs. */
  success: {
    masterGain: 0.55,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 880, attack: 0.004, decay: 0.1, peak: 0.07 },
      {
        kind: "tone",
        waveform: "sine",
        frequency: 1108.73,
        offset: 0.055,
        attack: 0.004,
        decay: 0.11,
        peak: 0.07,
      },
      {
        kind: "tone",
        waveform: "sine",
        frequency: 1318.51,
        offset: 0.11,
        attack: 0.004,
        decay: 0.2,
        peak: 0.08,
      },
    ],
    shimmer: { delay: 0.1, feedback: 0.24, wet: 0.18, lowpass: 4800 },
  },
  /** Soft knock + descending refusal. */
  error: {
    masterGain: 0.42,
    layers: [
      {
        kind: "noise",
        filterType: "bandpass",
        filterFrequency: 850,
        filterQ: 1.1,
        attack: 0.001,
        decay: 0.035,
        peak: 0.13,
      },
      {
        kind: "tone",
        waveform: "triangle",
        frequency: 440,
        offset: 0.025,
        attack: 0.004,
        decay: 0.09,
        peak: 0.045,
      },
      {
        kind: "tone",
        waveform: "triangle",
        frequency: 349.23,
        offset: 0.1,
        attack: 0.004,
        decay: 0.14,
        peak: 0.04,
      },
    ],
  },
  /** Focus tick into soft harmonic bloom (spin / ready). */
  ready: {
    masterGain: 0.45,
    layers: [
      {
        kind: "noise",
        filterType: "bandpass",
        filterFrequency: 3200,
        filterQ: 1.7,
        attack: 0.001,
        decay: 0.018,
        peak: 0.1,
      },
      {
        kind: "tone",
        waveform: "sine",
        frequency: 659.25,
        offset: 0.025,
        attack: 0.012,
        decay: 0.2,
        peak: 0.05,
      },
      {
        kind: "tone",
        waveform: "sine",
        frequency: 987.77,
        offset: 0.025,
        attack: 0.012,
        decay: 0.22,
        peak: 0.035,
      },
    ],
    shimmer: { delay: 0.13, feedback: 0.2, wet: 0.13, lowpass: 3600 },
  },
  /** Soft descending settle — Couch break open (quieter than word juice). */
  pause: {
    masterGain: 0.36,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 523.25, attack: 0.01, decay: 0.12, peak: 0.05 },
      {
        kind: "tone",
        waveform: "sine",
        frequency: 392,
        offset: 0.07,
        attack: 0.012,
        decay: 0.18,
        peak: 0.042,
      },
    ],
  },
  /** Soft ascending wake — Couch break resume. */
  resume: {
    masterGain: 0.38,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 392, attack: 0.01, decay: 0.1, peak: 0.045 },
      {
        kind: "tone",
        waveform: "sine",
        frequency: 523.25,
        offset: 0.06,
        attack: 0.012,
        decay: 0.16,
        peak: 0.052,
      },
    ],
  },
} as const satisfies Record<string, Recipe>;

export type SoundName = keyof typeof RECIPES;

export function isSoundName(value: string): value is SoundName {
  return Object.prototype.hasOwnProperty.call(RECIPES, value);
}
