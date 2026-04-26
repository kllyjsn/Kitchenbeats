export type PadBank = 'A' | 'B' | 'C' | 'D';

export type DrumType =
  | 'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat'
  | 'rimshot' | 'lowTom' | 'midTom' | 'highTom' | 'cowbell'
  | 'crash' | 'ride' | 'shaker' | 'conga' | 'claves' | 'clave2';

export interface PadConfig {
  id: number;
  name: string;
  color: string;
  volume: number;
  pan: number;
  pitch: number;
  filterFreq: number;
  filterQ: number;
  filterType: BiquadFilterType;
  reverbSend: number;
  delaySend: number;
  muted: boolean;
  soloed: boolean;
  chokeGroup: number;
  attack: number;
  release: number;
  drumType: DrumType;
}

export interface StepData {
  active: boolean;
  velocity: number;
}

export interface Pattern {
  id: number;
  name: string;
  steps: StepData[][];
  length: number;
  swing: number;
}

export interface MasterEffects {
  reverbDecay: number;
  reverbMix: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  filterFreq: number;
  filterQ: number;
  filterType: BiquadFilterType;
  compThreshold: number;
  compRatio: number;
  masterVolume: number;
  distortion: number;
}

export type ViewMode = 'pads' | 'sequencer' | 'mixer' | 'effects';

export type AppMode = 'studio' | 'keys' | 'dj' | 'compose';

// ── Song / Composer Types ───────────────────────────────────────────────

export interface SongTrackNote {
  step: number;
  note: number;
  duration: number;
  velocity: number;
}

export interface SongChordEvent {
  step: number;
  notes: number[];
  duration: number;
  velocity: number;
}

export interface SongSection {
  name: string;
  bars: number;
  energy: number;
  drumPattern: StepData[][];
  bassNotes: SongTrackNote[];
  chordNotes: SongChordEvent[];
  leadNotes: SongTrackNote[];
}

export interface GeneratedSong {
  title: string;
  key: string;
  scaleName: string;
  bpm: number;
  sections: SongSection[];
}

// ── Synth Types ─────────────────────────────────────────────────────────

export type OscWaveform = 'sine' | 'saw' | 'square' | 'triangle';

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SynthPreset {
  name: string;
  osc1Wave: OscWaveform;
  osc2Wave: OscWaveform;
  osc1Gain: number;
  osc2Gain: number;
  osc2Detune: number;
  osc2Octave: number;
  filterCutoff: number;
  filterResonance: number;
  filterEnvAmount: number;
  ampEnvelope: ADSREnvelope;
  filterEnvelope: ADSREnvelope;
  lfoRate: number;
  lfoDepth: number;
  lfoTarget: 'filter' | 'pitch' | 'amp';
  glide: number;
  reverbSend: number;
  delaySend: number;
}

export interface SynthNote {
  note: number;
  velocity: number;
  startStep: number;
  duration: number;
}

export interface SynthPattern {
  id: number;
  name: string;
  notes: SynthNote[];
  length: number;
}

// ── DJ Types ────────────────────────────────────────────────────────────

export interface DeckState {
  loaded: boolean;
  fileName: string;
  playing: boolean;
  bpm: number;
  position: number;
  duration: number;
  volume: number;
  speed: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  filterFreq: number;
  looping: boolean;
  loopStart: number;
  loopEnd: number;
  hotCues: (number | null)[];
  waveformData: Float32Array | null;
}

export const INITIAL_DECK_STATE: DeckState = {
  loaded: false,
  fileName: '',
  playing: false,
  bpm: 0,
  position: 0,
  duration: 0,
  volume: 1,
  speed: 1,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  filterFreq: 20000,
  looping: false,
  loopStart: 0,
  loopEnd: 0,
  hotCues: [null, null, null, null],
  waveformData: null,
};

// ── Synth Presets ───────────────────────────────────────────────────────

export const SYNTH_PRESETS: SynthPreset[] = [
  {
    name: 'DEEP BASS',
    osc1Wave: 'saw', osc2Wave: 'square',
    osc1Gain: 0.7, osc2Gain: 0.4, osc2Detune: 7, osc2Octave: 0,
    filterCutoff: 400, filterResonance: 4, filterEnvAmount: 600,
    ampEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.2 },
    filterEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.3 },
    lfoRate: 0, lfoDepth: 0, lfoTarget: 'filter', glide: 0.03,
    reverbSend: 0, delaySend: 0.1,
  },
  {
    name: 'SUB BASS',
    osc1Wave: 'sine', osc2Wave: 'sine',
    osc1Gain: 1.0, osc2Gain: 0.3, osc2Detune: 0, osc2Octave: -1,
    filterCutoff: 200, filterResonance: 1, filterEnvAmount: 100,
    ampEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.9, release: 0.15 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 },
    lfoRate: 0, lfoDepth: 0, lfoTarget: 'filter', glide: 0.05,
    reverbSend: 0, delaySend: 0,
  },
  {
    name: 'ACID LEAD',
    osc1Wave: 'saw', osc2Wave: 'saw',
    osc1Gain: 0.6, osc2Gain: 0.6, osc2Detune: -5, osc2Octave: 0,
    filterCutoff: 300, filterResonance: 14, filterEnvAmount: 3000,
    ampEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.1 },
    filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.15 },
    lfoRate: 0, lfoDepth: 0, lfoTarget: 'filter', glide: 0.02,
    reverbSend: 0.2, delaySend: 0.3,
  },
  {
    name: 'WARM PAD',
    osc1Wave: 'saw', osc2Wave: 'square',
    osc1Gain: 0.4, osc2Gain: 0.4, osc2Detune: 12, osc2Octave: 0,
    filterCutoff: 1200, filterResonance: 2, filterEnvAmount: 800,
    ampEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 1.0 },
    filterEnvelope: { attack: 0.6, decay: 0.8, sustain: 0.4, release: 0.8 },
    lfoRate: 3.5, lfoDepth: 200, lfoTarget: 'filter', glide: 0,
    reverbSend: 0.5, delaySend: 0.2,
  },
  {
    name: 'PLUCK',
    osc1Wave: 'triangle', osc2Wave: 'saw',
    osc1Gain: 0.6, osc2Gain: 0.3, osc2Detune: 3, osc2Octave: 1,
    filterCutoff: 2000, filterResonance: 3, filterEnvAmount: 4000,
    ampEnvelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.15 },
    filterEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.1 },
    lfoRate: 0, lfoDepth: 0, lfoTarget: 'filter', glide: 0,
    reverbSend: 0.3, delaySend: 0.4,
  },
  {
    name: 'REESE',
    osc1Wave: 'saw', osc2Wave: 'saw',
    osc1Gain: 0.6, osc2Gain: 0.6, osc2Detune: 25, osc2Octave: 0,
    filterCutoff: 600, filterResonance: 5, filterEnvAmount: 400,
    ampEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.4 },
    lfoRate: 1.5, lfoDepth: 300, lfoTarget: 'filter', glide: 0.04,
    reverbSend: 0.1, delaySend: 0.15,
  },
  {
    name: 'STAB',
    osc1Wave: 'square', osc2Wave: 'saw',
    osc1Gain: 0.5, osc2Gain: 0.5, osc2Detune: 0, osc2Octave: 1,
    filterCutoff: 5000, filterResonance: 2, filterEnvAmount: 2000,
    ampEnvelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.08 },
    filterEnvelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.08 },
    lfoRate: 0, lfoDepth: 0, lfoTarget: 'filter', glide: 0,
    reverbSend: 0.4, delaySend: 0.5,
  },
  {
    name: 'ORGAN',
    osc1Wave: 'sine', osc2Wave: 'sine',
    osc1Gain: 0.7, osc2Gain: 0.5, osc2Detune: 0, osc2Octave: 1,
    filterCutoff: 3000, filterResonance: 1, filterEnvAmount: 500,
    ampEnvelope: { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.05 },
    filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 },
    lfoRate: 5.5, lfoDepth: 5, lfoTarget: 'pitch', glide: 0,
    reverbSend: 0.3, delaySend: 0.1,
  },
];

// ── Note helpers ────────────────────────────────────────────────────────

export function noteToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function noteName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[note % 12]}${Math.floor(note / 12) - 1}`;
}

// ── Existing constants ──────────────────────────────────────────────────

export const PAD_COLORS = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759',
  '#00c7be', '#30b0c7', '#007aff', '#5856d6',
  '#af52de', '#ff2d55', '#a2845e', '#8e8e93',
  '#ff6b6b', '#48dbfb', '#feca57', '#1dd1a1',
];

export const KEYBOARD_MAP: Record<string, number> = {
  '1': 0,  '2': 1,  '3': 2,  '4': 3,
  'q': 4,  'w': 5,  'e': 6,  'r': 7,
  'a': 8,  's': 9,  'd': 10, 'f': 11,
  'z': 12, 'x': 13, 'c': 14, 'v': 15,
};

export const DEFAULT_KIT_NAMES: Record<number, { name: string; drum: DrumType }> = {
  0:  { name: '808 KICK', drum: 'kick' },
  1:  { name: '909 SNR',  drum: 'snare' },
  2:  { name: '909 CLP',  drum: 'clap' },
  3:  { name: 'C.HAT',    drum: 'closedHat' },
  4:  { name: 'O.HAT',    drum: 'openHat' },
  5:  { name: 'RIM',      drum: 'rimshot' },
  6:  { name: 'LO TOM',   drum: 'lowTom' },
  7:  { name: 'HI TOM',   drum: 'highTom' },
  8:  { name: '808 COWB',  drum: 'cowbell' },
  9:  { name: 'CRASH',    drum: 'crash' },
  10: { name: 'RIDE',     drum: 'ride' },
  11: { name: 'SHAKER',   drum: 'shaker' },
  12: { name: 'CONGA',    drum: 'conga' },
  13: { name: 'CLAVES',   drum: 'claves' },
  14: { name: 'PERC',     drum: 'clave2' },
  15: { name: 'MD TOM',   drum: 'midTom' },
};
