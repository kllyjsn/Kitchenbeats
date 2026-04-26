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
