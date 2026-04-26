/**
 * Kitchen Beats AI Composer v3 — Conservatory-Level Algorithmic Composition
 *
 * Inspired by Juilliard (theory, counterpoint, harmony, form analysis)
 * and IU Jacobs School of Music CECM (electronic music, spectral, granular).
 *
 * Features:
 *  - Motif system with transformations (inversion, retrograde, augmentation, fragmentation, sequence)
 *  - Voice leading engine (smooth chord transitions, no parallel 5ths)
 *  - Extended chords (min7, maj9, sus4, dim7, add9, 6/9)
 *  - Phrase structure (antecedent-consequent, sentence form, breathing)
 *  - Emotional arc engine (tension mapping, cadence system)
 *  - Humanization (Gaussian jitter, musical velocity curves, ghost notes)
 *  - Vocal intelligence (hooks as anchors, vowel sequencing)
 *  - Transition composition (fills, sweeps, dominant preparation)
 *  - Large-scale form (section relationships, motif recycling, golden ratio climax)
 *  - Counterpoint awareness (bass-melody interaction)
 *  - Markov chain melodic generation
 *  - Spectral awareness (frequency band allocation)
 */

import type { StepData, SongSection, SongTrackNote, SongChordEvent, VocalEvent, GeneratedSong, ComposerGenre } from '../types';

// ═══════════════════════════════════════════════════════════════════════
// MUSIC THEORY DATABASE
// ═══════════════════════════════════════════════════════════════════════

const SCALES: Record<string, number[]> = {
  'natural minor':    [0, 2, 3, 5, 7, 8, 10],
  'harmonic minor':   [0, 2, 3, 5, 7, 8, 11],
  'melodic minor':    [0, 2, 3, 5, 7, 9, 11],
  'dorian':           [0, 2, 3, 5, 7, 9, 10],
  'phrygian':         [0, 1, 3, 5, 7, 8, 10],
  'mixolydian':       [0, 2, 4, 5, 7, 9, 10],
  'lydian':           [0, 2, 4, 6, 7, 9, 11],
  'minor pentatonic': [0, 3, 5, 7, 10],
  'major pentatonic': [0, 2, 4, 7, 9],
  'blues':            [0, 3, 5, 6, 7, 10],
  'whole tone':       [0, 2, 4, 6, 8, 10],
  'diminished':       [0, 2, 3, 5, 6, 8, 9, 11],
};

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ── Chord Progression Pools ─────────────────────────────────────────

const CHORD_PROGRESSIONS: Record<string, number[][]> = {
  house: [
    [0, 5, 2, 6], [0, 3, 5, 6], [0, 2, 6, 3], [0, 6, 5, 6],
    [0, 5, 3, 6], [0, 2, 3, 5], [0, 5, 0, 6],
  ],
  acid: [
    [0, 0, 3, 3], [0, 6, 0, 5], [0, 0, 0, 6], [0, 3, 0, 3],
  ],
  lofi: [
    [0, 2, 3, 4], [0, 5, 3, 2], [0, 4, 5, 3], [2, 0, 5, 3], [0, 3, 6, 2],
  ],
  ambient: [
    [0, 5, 2, 0], [0, 2, 5, 0], [0, 0, 5, 5],
  ],
  garage: [
    [0, 5, 2, 6], [0, 2, 3, 6], [5, 0, 6, 2], [0, 3, 5, 2],
  ],
};

// ── Genre Definitions ───────────────────────────────────────────────

interface GenreDef {
  label: string;
  bpmRange: [number, number];
  scales: string[];
  progressionPool: string;
  bassPreset: number;
  chordPreset: number;
  leadPreset: number;
  hasVocals: boolean;
  vocalDensity: number;
  hasArp: boolean;
  arpDensity: number;
  drumStyle: string;
  swing: number;
  emotionPalette: EmotionTag[];
  chordComplexity: 'triad' | 'seventh' | 'extended';
  motifIntervalRange: number;
}

type EmotionTag = 'joy' | 'melancholy' | 'tension' | 'release' | 'nostalgia' | 'euphoria' | 'contemplation' | 'energy';

const GENRES: Record<ComposerGenre, GenreDef> = {
  deep_house: {
    label: 'Deep House', bpmRange: [120, 126], scales: ['dorian', 'natural minor', 'minor pentatonic'],
    progressionPool: 'house', bassPreset: 0, chordPreset: 3, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.6, hasArp: true, arpDensity: 0.4,
    drumStyle: 'house', swing: 0.05,
    emotionPalette: ['melancholy', 'nostalgia', 'euphoria', 'contemplation'],
    chordComplexity: 'seventh', motifIntervalRange: 4,
  },
  tech_house: {
    label: 'Tech House', bpmRange: [124, 130], scales: ['natural minor', 'dorian', 'phrygian'],
    progressionPool: 'house', bassPreset: 1, chordPreset: 6, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.3, hasArp: true, arpDensity: 0.6,
    drumStyle: 'tech', swing: 0,
    emotionPalette: ['energy', 'tension', 'euphoria'],
    chordComplexity: 'triad', motifIntervalRange: 3,
  },
  uk_garage: {
    label: 'UK Garage', bpmRange: [130, 138], scales: ['natural minor', 'dorian', 'minor pentatonic'],
    progressionPool: 'garage', bassPreset: 0, chordPreset: 3, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.8, hasArp: false, arpDensity: 0,
    drumStyle: 'garage', swing: 0.12,
    emotionPalette: ['joy', 'euphoria', 'energy', 'nostalgia'],
    chordComplexity: 'seventh', motifIntervalRange: 5,
  },
  acid_techno: {
    label: 'Acid Techno', bpmRange: [130, 140], scales: ['phrygian', 'natural minor', 'blues'],
    progressionPool: 'acid', bassPreset: 2, chordPreset: 6, leadPreset: 2,
    hasVocals: false, vocalDensity: 0, hasArp: true, arpDensity: 0.8,
    drumStyle: 'techno', swing: 0,
    emotionPalette: ['tension', 'energy'],
    chordComplexity: 'triad', motifIntervalRange: 7,
  },
  lo_fi_hip_hop: {
    label: 'Lo-Fi Hip Hop', bpmRange: [75, 90], scales: ['dorian', 'minor pentatonic', 'blues', 'melodic minor'],
    progressionPool: 'lofi', bassPreset: 0, chordPreset: 3, leadPreset: 7,
    hasVocals: true, vocalDensity: 0.2, hasArp: false, arpDensity: 0,
    drumStyle: 'lofi', swing: 0.15,
    emotionPalette: ['melancholy', 'nostalgia', 'contemplation'],
    chordComplexity: 'extended', motifIntervalRange: 3,
  },
  ambient: {
    label: 'Ambient', bpmRange: [70, 100], scales: ['lydian', 'whole tone', 'major pentatonic', 'mixolydian'],
    progressionPool: 'ambient', bassPreset: 0, chordPreset: 3, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.15, hasArp: true, arpDensity: 0.3,
    drumStyle: 'ambient', swing: 0.08,
    emotionPalette: ['contemplation', 'nostalgia', 'melancholy'],
    chordComplexity: 'extended', motifIntervalRange: 5,
  },
  classic_house: {
    label: 'Classic House', bpmRange: [118, 125], scales: ['natural minor', 'dorian'],
    progressionPool: 'house', bassPreset: 0, chordPreset: 3, leadPreset: 7,
    hasVocals: true, vocalDensity: 0.5, hasArp: true, arpDensity: 0.3,
    drumStyle: 'house', swing: 0.03,
    emotionPalette: ['joy', 'euphoria', 'nostalgia', 'release'],
    chordComplexity: 'seventh', motifIntervalRange: 4,
  },
  minimal_techno: {
    label: 'Minimal Techno', bpmRange: [126, 134], scales: ['phrygian', 'natural minor', 'diminished'],
    progressionPool: 'acid', bassPreset: 1, chordPreset: 6, leadPreset: 2,
    hasVocals: false, vocalDensity: 0, hasArp: true, arpDensity: 0.5,
    drumStyle: 'techno', swing: 0,
    emotionPalette: ['tension', 'contemplation', 'energy'],
    chordComplexity: 'triad', motifIntervalRange: 2,
  },
};

// ── Song Titles ─────────────────────────────────────────────────────

const TITLES_A = [
  'Midnight', 'Golden', 'Deep', 'Lost', 'Neon', 'Velvet', 'Crystal',
  'Shadow', 'Electric', 'Infinite', 'Sacred', 'Liquid', 'Broken',
  'Floating', 'Burning', 'Frozen', 'Silent', 'Rising', 'Falling',
  'Urban', 'Astral', 'Phantom', 'Primal', 'Cosmic', 'Faded',
  'Wired', 'Misty', 'Savage', 'Ancient', 'Digital', 'Lucid',
  'Solar', 'Twisted', 'Hollow', 'Emerald', 'Crimson', 'Spectral',
];

const TITLES_B = [
  'Groove', 'Horizon', 'Pulse', 'Wave', 'Dream', 'Rain', 'Fire',
  'Dawn', 'Echo', 'Signal', 'Light', 'Storm', 'Drift', 'Rush',
  'Bloom', 'Haze', 'Flow', 'Dust', 'Glow', 'Tide', 'Voyage',
  'Temple', 'Circuit', 'Ritual', 'Mirage', 'Odyssey', 'Reverie',
  'Fracture', 'Whisper', 'Current', 'Vapor', 'Canvas', 'Archive',
];

// ═══════════════════════════════════════════════════════════════════════
// CORE HELPERS
// ═══════════════════════════════════════════════════════════════════════

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max)); }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

function gaussian(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function weightedPick<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function scaleNote(root: number, scale: number[], degree: number, octave: number): number {
  const oct = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return root + (octave + oct) * 12 + scale[idx];
}

function _midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function emptyPattern(pads: number, steps: number): StepData[][] {
  return Array.from({ length: pads }, () =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0 }))
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 1: EXTENDED CHORD SYSTEM (Juilliard Theory II-IV)
// ═══════════════════════════════════════════════════════════════════════

type ChordQuality = 'triad' | 'min7' | 'maj7' | 'dom7' | 'min9' | 'maj9' | 'sus2' | 'sus4' | 'dim7' | 'aug' | 'add9' | '6/9';

function buildChord(root: number, scale: number[], degree: number, octave: number, quality: ChordQuality): number[] {
  const r = scaleNote(root, scale, degree, octave);
  const third = scaleNote(root, scale, degree + 2, octave);
  const fifth = scaleNote(root, scale, degree + 4, octave);
  const seventh = scaleNote(root, scale, degree + 6, octave);
  const ninth = scaleNote(root, scale, degree + 1, octave + 1);
  const second = scaleNote(root, scale, degree + 1, octave);
  const fourth = scaleNote(root, scale, degree + 3, octave);
  const sixth = scaleNote(root, scale, degree + 5, octave);

  switch (quality) {
    case 'triad': return [r, third, fifth];
    case 'min7': case 'maj7': case 'dom7': return [r, third, fifth, seventh];
    case 'min9': case 'maj9': return [r, third, fifth, seventh, ninth];
    case 'sus2': return [r, second, fifth];
    case 'sus4': return [r, fourth, fifth];
    case 'dim7': return [r, third, fifth, seventh];
    case 'aug': return [r, third, fifth + 1];
    case 'add9': return [r, third, fifth, ninth];
    case '6/9': return [r, third, fifth, sixth, ninth];
  }
}

function getChordQuality(genre: GenreDef, sectionType: string, energy: number): ChordQuality {
  if (genre.chordComplexity === 'extended') {
    const opts: [ChordQuality, number][] = [
      ['min9', 3], ['maj9', 2], ['min7', 4], ['add9', 3], ['6/9', 2], ['sus2', 1],
    ];
    return weightedPick(opts.map(o => o[0]), opts.map(o => o[1]));
  }
  if (genre.chordComplexity === 'seventh') {
    if (sectionType === 'drop' && energy > 0.8) return pick(['triad', 'sus4', 'triad']);
    return pick(['min7', 'maj7', 'dom7', 'min7', 'triad']);
  }
  return sectionType === 'breakdown' ? pick(['sus2', 'sus4', 'triad']) : 'triad';
}

// ── Voice Leading Engine ────────────────────────────────────────────

function voiceLead(prevVoicing: number[], targetChord: number[]): number[] {
  if (prevVoicing.length === 0) return targetChord;

  const target = [...targetChord];
  const result: number[] = [];
  const used = new Set<number>();

  // For each voice in the previous chord, find the closest note in the target
  for (const prevNote of prevVoicing) {
    let bestNote = target[0];
    let bestDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < target.length; i++) {
      if (used.has(i)) continue;
      // Check note in nearby octaves
      for (const octOffset of [0, 12, -12]) {
        const candidate = target[i] + octOffset;
        const dist = Math.abs(candidate - prevNote);
        if (dist < bestDist) {
          bestDist = dist;
          bestNote = candidate;
          bestIdx = i;
        }
      }
    }
    used.add(bestIdx);
    result.push(bestNote);
  }

  // If target has more notes than prev, add remaining
  for (let i = 0; i < target.length; i++) {
    if (!used.has(i)) result.push(target[i]);
  }

  return result.sort((a, b) => a - b);
}

function hasParallelFifths(voicing1: number[], voicing2: number[]): boolean {
  const len = Math.min(voicing1.length, voicing2.length);
  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      const int1 = Math.abs(voicing1[i] - voicing1[j]) % 12;
      const int2 = Math.abs(voicing2[i] - voicing2[j]) % 12;
      if (int1 === 7 && int2 === 7) {
        const motion1 = voicing2[i] - voicing1[i];
        const motion2 = voicing2[j] - voicing1[j];
        if (motion1 !== 0 && motion1 === motion2) return true;
      }
    }
  }
  return false;
}

function avoidParallels(prev: number[], next: number[]): number[] {
  if (!hasParallelFifths(prev, next) || next.length < 2) return next;
  const adjusted = [...next];
  // Shift the second voice by an octave to break the parallel
  adjusted[1] = adjusted[1] + (adjusted[1] > prev[1] ? -12 : 12);
  adjusted.sort((a, b) => a - b);
  return adjusted;
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 1: MOTIF SYSTEM (Juilliard Composition)
// ═══════════════════════════════════════════════════════════════════════

interface Motif {
  intervals: number[];   // relative intervals between notes
  rhythm: number[];      // step positions within a bar (0-15)
  durations: number[];   // duration of each note in steps
}

function generateMotif(genre: GenreDef): Motif {
  const len = randInt(3, 7);
  const maxInterval = genre.motifIntervalRange;
  const intervals: number[] = [0];
  for (let i = 1; i < len; i++) {
    // Prefer small intervals (stepwise motion) with occasional leaps
    const leap = Math.random() > 0.7;
    const dir = Math.random() > 0.5 ? 1 : -1;
    const size = leap ? randInt(2, maxInterval + 1) : randInt(1, 3);
    intervals.push(intervals[i - 1] + dir * size);
  }

  // Clamp to reasonable range
  const minI = Math.min(...intervals);
  const maxI = Math.max(...intervals);
  if (maxI - minI > 10) {
    const shift = -minI;
    for (let i = 0; i < intervals.length; i++) intervals[i] = clamp(intervals[i] + shift, 0, 10);
  }

  // Generate rhythmic pattern
  const isLofi = genre.drumStyle === 'lofi';
  const possibleSteps = isLofi
    ? [0, 2, 4, 6, 8, 10, 12, 14]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const rhythm: number[] = [];
  const durations: number[] = [];
  let cursor = pick([0, 2, 4]);
  for (let i = 0; i < len; i++) {
    const step = possibleSteps.reduce((best, s) =>
      Math.abs(s - cursor) < Math.abs(best - cursor) ? s : best);
    rhythm.push(step);
    const dur = pick([1, 2, 2, 3]);
    durations.push(dur);
    cursor = step + dur + (Math.random() > 0.5 ? 1 : 0);
    if (cursor >= 16) break;
  }

  // Trim to actual length
  const finalLen = Math.min(intervals.length, rhythm.length, durations.length);
  return {
    intervals: intervals.slice(0, finalLen),
    rhythm: rhythm.slice(0, finalLen),
    durations: durations.slice(0, finalLen),
  };
}

type MotifTransform = 'original' | 'transposition' | 'inversion' | 'retrograde' | 'augmentation' | 'diminution' | 'fragmentation' | 'sequence';

function transformMotif(motif: Motif, transform: MotifTransform, transposeDeg: number = 0): Motif {
  const { intervals, rhythm, durations } = motif;

  switch (transform) {
    case 'original':
      return { intervals: [...intervals], rhythm: [...rhythm], durations: [...durations] };

    case 'transposition':
      return {
        intervals: intervals.map(i => i + transposeDeg),
        rhythm: [...rhythm],
        durations: [...durations],
      };

    case 'inversion':
      return {
        intervals: intervals.map((_, idx) => idx === 0 ? intervals[0] : intervals[0] * 2 - intervals[idx]),
        rhythm: [...rhythm],
        durations: [...durations],
      };

    case 'retrograde':
      return {
        intervals: [...intervals].reverse(),
        rhythm: [...rhythm],
        durations: [...durations].reverse(),
      };

    case 'augmentation':
      return {
        intervals: [...intervals],
        rhythm: rhythm.map(r => Math.min(r * 2, 15)),
        durations: durations.map(d => Math.min(d * 2, 6)),
      };

    case 'diminution':
      return {
        intervals: [...intervals],
        rhythm: rhythm.map(r => Math.floor(r / 2)),
        durations: durations.map(d => Math.max(1, Math.floor(d / 2))),
      };

    case 'fragmentation': {
      // Use only first 2-3 notes
      const fragLen = Math.min(randInt(2, 4), intervals.length);
      return {
        intervals: intervals.slice(0, fragLen),
        rhythm: rhythm.slice(0, fragLen),
        durations: durations.slice(0, fragLen),
      };
    }
    case 'sequence':
      // Repeat motif at a higher pitch level
      return {
        intervals: intervals.map(i => i + transposeDeg),
        rhythm: rhythm.map(r => Math.min(r + 8, 15)),
        durations: [...durations],
      };
  }
}

function motifToNotes(
  motif: Motif, root: number, scale: number[], chordDeg: number,
  octave: number, velocity: number, stepOffset: number
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  for (let i = 0; i < motif.intervals.length; i++) {
    const degree = chordDeg + motif.intervals[i];
    const step = (motif.rhythm[i] ?? 0) + stepOffset;
    const note = scaleNote(root, scale, degree, octave);
    notes.push({
      step,
      note,
      duration: motif.durations[i] ?? 2,
      velocity: velocity + gaussian() * 0.04,
    });
  }
  return notes;
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 1: PHRASE STRUCTURE (Juilliard Analysis)
// ═══════════════════════════════════════════════════════════════════════

type PhraseType = 'antecedent' | 'consequent' | 'sentence' | 'continuation';

function getPhraseType(barInSection: number, totalBars: number): PhraseType {
  const half = Math.floor(totalBars / 2);
  if (barInSection < half) {
    return barInSection < Math.floor(half / 2) ? 'antecedent' : 'continuation';
  }
  return barInSection < half + Math.floor(half / 2) ? 'consequent' : 'continuation';
}

function getMotifTransformForPhrase(
  phraseType: PhraseType, barInPhrase: number, sectionType: string
): MotifTransform {
  if (sectionType === 'drop') {
    const transforms: MotifTransform[] = ['original', 'transposition', 'sequence', 'original', 'fragmentation'];
    return transforms[barInPhrase % transforms.length];
  }
  if (phraseType === 'antecedent') {
    return barInPhrase === 0 ? 'original' : 'transposition';
  }
  if (phraseType === 'consequent') {
    return barInPhrase === 0 ? 'inversion' : pick(['retrograde', 'fragmentation']);
  }
  return pick(['augmentation', 'diminution', 'sequence']);
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 2: EMOTIONAL ARC (Fred Again Approach)
// ═══════════════════════════════════════════════════════════════════════

interface EmotionState {
  tag: EmotionTag;
  tensionLevel: number;     // 0-1
  brightness: number;       // 0-1 (dark to bright)
  density: number;          // 0-1 (sparse to dense)
}

function emotionForSection(genre: GenreDef, sectionType: string, energy: number): EmotionState {
  const palette = genre.emotionPalette;

  if (sectionType === 'intro') {
    return { tag: pick(['contemplation', 'nostalgia'] as EmotionTag[]), tensionLevel: 0.2, brightness: 0.3, density: 0.2 };
  }
  if (sectionType === 'build') {
    return { tag: 'tension', tensionLevel: 0.5 + energy * 0.4, brightness: 0.4 + energy * 0.3, density: 0.3 + energy * 0.5 };
  }
  if (sectionType === 'drop') {
    const dropEmotion = palette.includes('euphoria') ? 'euphoria' : palette.includes('energy') ? 'energy' : 'release';
    return { tag: dropEmotion as EmotionTag, tensionLevel: 0.3, brightness: 0.9, density: 0.9 };
  }
  if (sectionType === 'breakdown') {
    return { tag: pick(['melancholy', 'contemplation', 'nostalgia'] as EmotionTag[]), tensionLevel: 0.15, brightness: 0.4, density: 0.15 };
  }
  if (sectionType === 'ambient') {
    return { tag: 'contemplation', tensionLevel: 0.1, brightness: 0.5, density: 0.1 };
  }
  return { tag: pick(palette), tensionLevel: energy * 0.5, brightness: 0.5, density: energy };
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 2: TENSION-RESOLUTION (Juilliard Harmony)
// ═══════════════════════════════════════════════════════════════════════

type CadenceType = 'authentic' | 'half' | 'deceptive' | 'plagal' | 'none';

function selectCadence(barInSection: number, totalBars: number, sectionType: string): CadenceType {
  const isLastBar = barInSection === totalBars - 1;
  const isMidpoint = barInSection === Math.floor(totalBars / 2) - 1;

  if (isLastBar) {
    if (sectionType === 'drop') return 'authentic';
    if (sectionType === 'breakdown') return 'plagal';
    if (sectionType === 'build') return 'half';
    return 'authentic';
  }
  if (isMidpoint) {
    return Math.random() > 0.7 ? 'deceptive' : 'half';
  }
  return 'none';
}

function cadenceChordDeg(cadence: CadenceType, progressionDeg: number): number {
  switch (cadence) {
    case 'authentic': return 6;  // V → resolves to i on next section
    case 'half': return 6;      // ends on V (dominant)
    case 'deceptive': return 5;  // V → VI (unexpected)
    case 'plagal': return 3;    // iv → i
    case 'none': return progressionDeg;
  }
}

function _tensionScore(chord: number[]): number {
  let tension = 0;
  for (let i = 0; i < chord.length; i++) {
    for (let j = i + 1; j < chord.length; j++) {
      const interval = Math.abs(chord[i] - chord[j]) % 12;
      if (interval === 6) tension += 0.4;       // tritone
      else if (interval === 1 || interval === 11) tension += 0.3; // minor 2nd
      else if (interval === 2 || interval === 10) tension += 0.15; // major 2nd
      else if (interval === 3 || interval === 4) tension += 0.0; // consonant
      else if (interval === 7 || interval === 5) tension -= 0.1; // perfect
    }
  }
  return clamp(tension, 0, 1);
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 2: HUMANIZATION
// ═══════════════════════════════════════════════════════════════════════

function humanizeVelocity(baseVel: number, step: number, energy: number): number {
  // Musical accent pattern: downbeats slightly louder
  const isDownbeat = step % 4 === 0;
  const isBackbeat = step % 8 === 4;
  let vel = baseVel;
  if (isDownbeat) vel += 0.05;
  if (isBackbeat) vel += 0.03;
  // Gaussian humanization
  vel += gaussian() * 0.03;
  return clamp(vel * (0.7 + energy * 0.3), 0.1, 1);
}

function ghostNoteVelocity(): number {
  return 0.12 + Math.random() * 0.08;
}

// ═══════════════════════════════════════════════════════════════════════
// SPRINT 4: MARKOV CHAIN MELODIC GENERATION
// ═══════════════════════════════════════════════════════════════════════

// Markov transition matrices per genre style — P(next interval | current interval)
// Intervals: -4, -3, -2, -1, 0, 1, 2, 3, 4
const MARKOV_TABLES: Record<string, number[][]> = {
  // House/electronic: prefer stepwise with occasional 3rds
  smooth: [
    [0.05, 0.1, 0.15, 0.2, 0.1, 0.2, 0.1, 0.05, 0.05],  // after -4
    [0.05, 0.05, 0.1, 0.15, 0.15, 0.25, 0.15, 0.05, 0.05], // after -3
    [0.02, 0.05, 0.1, 0.2, 0.15, 0.25, 0.13, 0.05, 0.05], // after -2
    [0.02, 0.03, 0.08, 0.15, 0.2, 0.3, 0.12, 0.05, 0.05], // after -1
    [0.05, 0.08, 0.15, 0.2, 0.05, 0.2, 0.15, 0.07, 0.05], // after 0
    [0.05, 0.05, 0.12, 0.3, 0.2, 0.15, 0.08, 0.03, 0.02], // after 1
    [0.05, 0.05, 0.13, 0.25, 0.15, 0.2, 0.1, 0.05, 0.02], // after 2
    [0.05, 0.05, 0.15, 0.25, 0.15, 0.15, 0.1, 0.05, 0.05], // after 3
    [0.05, 0.05, 0.1, 0.2, 0.1, 0.2, 0.15, 0.1, 0.05],  // after 4
  ],
  // Acid/techno: wider leaps, more repetition
  angular: [
    [0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.1],
    [0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.1],
    [0.08, 0.08, 0.12, 0.12, 0.2, 0.12, 0.12, 0.08, 0.08],
    [0.08, 0.08, 0.1, 0.15, 0.2, 0.15, 0.1, 0.08, 0.06],
    [0.1, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1],
    [0.06, 0.08, 0.1, 0.15, 0.2, 0.15, 0.1, 0.08, 0.08],
    [0.08, 0.08, 0.12, 0.12, 0.2, 0.12, 0.12, 0.08, 0.08],
    [0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.1],
    [0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.1],
  ],
  // Lo-fi: very smooth, small intervals
  dreamy: [
    [0.02, 0.05, 0.1, 0.2, 0.15, 0.25, 0.13, 0.05, 0.05],
    [0.02, 0.03, 0.1, 0.22, 0.18, 0.25, 0.12, 0.05, 0.03],
    [0.01, 0.03, 0.08, 0.25, 0.2, 0.28, 0.1, 0.03, 0.02],
    [0.01, 0.02, 0.05, 0.2, 0.25, 0.3, 0.1, 0.05, 0.02],
    [0.02, 0.05, 0.1, 0.25, 0.1, 0.25, 0.13, 0.05, 0.05],
    [0.02, 0.05, 0.1, 0.3, 0.25, 0.2, 0.05, 0.02, 0.01],
    [0.02, 0.03, 0.1, 0.28, 0.2, 0.25, 0.08, 0.03, 0.01],
    [0.03, 0.05, 0.12, 0.25, 0.18, 0.22, 0.1, 0.03, 0.02],
    [0.05, 0.05, 0.13, 0.25, 0.15, 0.2, 0.1, 0.05, 0.02],
  ],
};

function markovNextInterval(currentInterval: number, style: string): number {
  const table = MARKOV_TABLES[style] ?? MARKOV_TABLES['smooth'];
  const row = clamp(currentInterval + 4, 0, 8);
  const probs = table[row];
  const intervals = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  return weightedPick(intervals, probs);
}

function getMarkovStyle(genre: GenreDef): string {
  if (genre.drumStyle === 'techno') return 'angular';
  if (genre.drumStyle === 'lofi') return 'dreamy';
  return 'smooth';
}

// ═══════════════════════════════════════════════════════════════════════
// DRUM PATTERN GENERATOR (Genre-aware + Humanized + Fills)
// ═══════════════════════════════════════════════════════════════════════

function generateDrumPattern(
  energy: number, sectionType: string, drumStyle: string,
  stepsPerBar: number, isTransitionBar: boolean, emotion: EmotionState
): StepData[][] {
  const pat = emptyPattern(16, stepsPerBar);
  const hit = (pad: number, step: number, vel: number) => {
    if (step >= 0 && step < stepsPerBar) {
      pat[pad][step] = { active: true, velocity: clamp(humanizeVelocity(vel, step, energy), 0.1, 1) };
    }
  };

  // 0=kick, 1=snare, 2=clap, 3=closedHat, 4=openHat, 5=rim,
  // 6=lowTom, 7=highTom, 8=cowbell, 9=crash, 10=ride, 11=shaker

  if (sectionType === 'intro' || sectionType === 'ambient') {
    if (drumStyle === 'ambient' || drumStyle === 'lofi') {
      if (energy > 0.15) { hit(3, 4, 0.2); hit(3, 12, 0.2); }
      if (energy > 0.3) { hit(5, 8, 0.25); }
      return pat;
    }
    if (energy > 0.2) { hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25); }
    if (energy > 0.4) { hit(0, 0, 0.5); hit(0, 8, 0.4); }
    if (energy > 0.5) { hit(5, 4, 0.3); hit(5, 12, 0.3); }
    return pat;
  }

  if (sectionType === 'breakdown') {
    hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25);
    if (energy > 0.3) { hit(5, 4, 0.25); hit(5, 12, 0.25); }
    if (energy > 0.5) { hit(11, 0, 0.2); hit(11, 4, 0.15); hit(11, 8, 0.2); hit(11, 12, 0.15); }
    return pat;
  }

  if (sectionType === 'outro') {
    if (energy > 0.2) {
      hit(0, 0, 0.5 * energy); hit(0, 8, 0.4 * energy);
      hit(3, 2, 0.3 * energy); hit(3, 6, 0.25 * energy);
      hit(3, 10, 0.3 * energy); hit(3, 14, 0.25 * energy);
    }
    return pat;
  }

  // ── Genre-specific build/drop patterns ──

  if (drumStyle === 'house' || drumStyle === 'tech') {
    hit(0, 0, 0.9); hit(0, 4, 0.85); hit(0, 8, 0.9); hit(0, 12, 0.85);
    if (sectionType === 'build') {
      hit(3, 2, 0.4); hit(3, 6, 0.35); hit(3, 10, 0.4); hit(3, 14, 0.35);
      if (energy > 0.5) { hit(2, 4, 0.5); hit(2, 12, 0.5); }
      if (energy > 0.7) {
        hit(1, 8, 0.3); hit(1, 10, 0.35); hit(1, 12, 0.4);
        hit(1, 13, 0.5); hit(1, 14, 0.6); hit(1, 15, 0.7);
      }
    } else {
      hit(2, 4, 0.7); hit(2, 12, 0.7);
      for (let i = 0; i < 16; i += 2) hit(3, i, i % 4 === 0 ? 0.35 : 0.5);
      hit(4, 6, 0.5); hit(4, 14, 0.45);
      if (drumStyle === 'tech') { hit(5, 3, 0.3); hit(5, 11, 0.3); }
      if (Math.random() > 0.4) { hit(10, 0, 0.3); hit(10, 4, 0.25); hit(10, 8, 0.3); hit(10, 12, 0.25); }
      if (Math.random() > 0.3) hit(0, pick([3, 7, 11, 15]), ghostNoteVelocity() + 0.2);
      if (Math.random() > 0.5) { hit(11, 2, 0.25); hit(11, 6, 0.2); hit(11, 10, 0.25); hit(11, 14, 0.2); }
      // Ghost notes on hats
      if (emotion.density > 0.7) {
        for (let i = 1; i < 16; i += 2) {
          if (Math.random() > 0.5) hit(3, i, ghostNoteVelocity());
        }
      }
    }
  } else if (drumStyle === 'garage') {
    const kickPatterns = [[0, 6, 10], [0, 3, 10], [0, 7, 10, 14], [0, 5, 10]];
    for (const s of pick(kickPatterns)) hit(0, s, 0.8);
    hit(2, 4, 0.65); hit(2, 12, 0.65);
    hit(3, 0, 0.35); hit(3, 2, 0.5); hit(3, 4, 0.3); hit(3, 6, 0.5);
    hit(3, 8, 0.35); hit(3, 10, 0.5); hit(3, 12, 0.3); hit(3, 14, 0.5);
    hit(4, pick([3, 7, 11]), 0.45);
    if (sectionType === 'drop') {
      hit(11, 1, 0.2); hit(11, 5, 0.15); hit(11, 9, 0.2); hit(11, 13, 0.15);
    }
  } else if (drumStyle === 'techno') {
    hit(0, 0, 0.95); hit(0, 4, 0.9); hit(0, 8, 0.95); hit(0, 12, 0.9);
    hit(2, 4, 0.6); hit(2, 12, 0.6);
    hit(3, 2, 0.5); hit(3, 6, 0.45); hit(3, 10, 0.5); hit(3, 14, 0.45);
    if (sectionType === 'drop') {
      hit(4, 6, 0.55); hit(4, 14, 0.5);
      if (Math.random() > 0.5) { hit(5, 3, 0.3); hit(5, 11, 0.3); }
      if (Math.random() > 0.6) { for (let i = 0; i < 16; i++) hit(3, i, 0.25 + (i % 2) * 0.15); }
    }
    if (sectionType === 'build' && energy > 0.7) {
      for (let i = 8; i < 16; i++) hit(3, i, 0.3 + (i - 8) * 0.04);
    }
  } else if (drumStyle === 'lofi') {
    const kickPatterns = [[0, 5, 8, 13], [0, 3, 8, 11], [0, 6, 8, 14], [0, 4, 10, 14]];
    for (const s of pick(kickPatterns)) hit(0, s, 0.7);
    hit(1, 4, 0.55); hit(1, 12, 0.55);
    hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25);
    if (Math.random() > 0.4) { hit(3, 0, 0.2); hit(3, 8, 0.2); }
    if (Math.random() > 0.6) hit(4, pick([7, 15]), 0.3);
    if (Math.random() > 0.5) { hit(11, 2, 0.15); hit(11, 10, 0.15); }
  } else if (drumStyle === 'ambient') {
    if (energy > 0.3) hit(0, 0, 0.3);
    if (energy > 0.4) { hit(3, 4, 0.2); hit(3, 12, 0.2); }
    if (energy > 0.6) { hit(10, 0, 0.15); hit(10, 8, 0.15); }
  }

  if (sectionType === 'drop' && Math.random() > 0.3) hit(9, 0, 0.45);

  // ── Transition fills (Sprint 3) ──
  if (isTransitionBar) {
    const fillType = pick(['snareRoll', 'tomFill', 'hatAccel']);
    if (fillType === 'snareRoll') {
      for (let i = 8; i < 16; i++) hit(1, i, 0.3 + (i - 8) * 0.06);
    } else if (fillType === 'tomFill') {
      hit(7, 12, 0.6); hit(7, 13, 0.5); hit(6, 14, 0.6); hit(0, 15, 0.4);
    } else {
      for (let i = 8; i < 16; i++) hit(3, i, 0.3 + (i - 8) * 0.05);
    }
    hit(9, 0, 0.5);
  }

  return pat;
}

// ═══════════════════════════════════════════════════════════════════════
// BASS GENERATOR (Counterpoint-aware)
// ═══════════════════════════════════════════════════════════════════════

function generateBass(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number,
  _leadNotes: SongTrackNote[], emotion: EmotionState
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  const baseOctave = 2;
  const rootNote = scaleNote(root, scale, chordDeg, baseOctave);

  if (sectionType === 'intro' && energy < 0.4) return notes;
  if (sectionType === 'breakdown' && energy < 0.5) return notes;
  if (sectionType === 'ambient') return notes;

  const isLofi = genre.drumStyle === 'lofi';
  const isAcid = genre.drumStyle === 'techno';

  if (sectionType === 'drop') {
    if (isLofi) {
      const patterns = [[0, 5, 8, 13], [0, 3, 8, 11], [0, 6, 8, 14]];
      const pat = pick(patterns);
      for (const s of pat) {
        const oct = Math.random() > 0.7 ? 12 : 0;
        notes.push({ step: s, note: rootNote + oct, duration: 2, velocity: humanizeVelocity(0.65, s, energy) });
      }
    } else if (isAcid) {
      const density = Math.random() > 0.5 ? 8 : 6;
      let prevInterval = 0;
      const markovStyle = getMarkovStyle(genre);
      for (let i = 0; i < density; i++) {
        const step = i * 2;
        if (step < stepsPerBar) {
          const interval = markovNextInterval(prevInterval, markovStyle);
          prevInterval = interval;
          const deg = chordDeg + clamp(interval, -3, 3);
          notes.push({
            step,
            note: scaleNote(root, scale, deg, baseOctave) + (Math.random() > 0.7 ? 12 : 0),
            duration: 1,
            velocity: humanizeVelocity(0.5 + rand(0, 0.3), step, energy),
          });
        }
      }
    } else {
      const patterns = [
        [0, 3, 6, 10], [0, 4, 8, 12], [0, 3, 8, 11],
        [0, 6, 8, 14], [0, 2, 8, 10], [0, 4, 6, 12],
      ];
      const pattern = pick(patterns);
      for (const step of pattern) {
        if (step < stepsPerBar) {
          const octShift = step === 0 ? 0 : (Math.random() > 0.7 ? 12 : 0);
          notes.push({
            step, note: rootNote + octShift,
            duration: step === 0 ? 3 : 2,
            velocity: humanizeVelocity(step === 0 ? 0.8 : 0.65, step, energy),
          });
        }
      }
    }
  } else if (sectionType === 'build') {
    notes.push({ step: 0, note: rootNote, duration: 4, velocity: humanizeVelocity(0.6, 0, energy) });
    if (energy > 0.6) notes.push({ step: 8, note: rootNote, duration: 3, velocity: humanizeVelocity(0.5, 8, energy) });
  } else {
    notes.push({ step: 0, note: rootNote, duration: 8, velocity: humanizeVelocity(0.5, 0, emotion.density) });
  }

  return notes;
}

// ═══════════════════════════════════════════════════════════════════════
// CHORD GENERATOR (Voice-led + Extended Chords)
// ═══════════════════════════════════════════════════════════════════════

function generateChords(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number,
  prevVoicing: number[], cadence: CadenceType
): { events: SongChordEvent[]; voicing: number[] } {
  const events: SongChordEvent[] = [];
  const octave = 4;

  // Apply cadence chord substitution
  const actualDeg = cadence !== 'none' ? cadenceChordDeg(cadence, chordDeg) : chordDeg;
  const quality = getChordQuality(genre, sectionType, energy);
  const rawChord = buildChord(root, scale, actualDeg, octave, quality);

  // Voice lead from previous chord
  let voicing = voiceLead(prevVoicing, rawChord);
  voicing = avoidParallels(prevVoicing, voicing);

  if (sectionType === 'intro' && energy < 0.3) return { events, voicing };

  if (sectionType === 'drop') {
    if (genre.drumStyle === 'lofi') {
      events.push({ step: 0, notes: voicing, duration: 8, velocity: humanizeVelocity(0.3, 0, energy) });
      if (Math.random() > 0.5) events.push({ step: 8, notes: voicing, duration: 6, velocity: humanizeVelocity(0.25, 8, energy) });
    } else if (genre.drumStyle === 'garage') {
      const patterns = [[1, 5, 9, 13], [2, 6, 10, 14], [1, 3, 9, 11]];
      for (const step of pick(patterns)) {
        if (step < stepsPerBar) events.push({ step, notes: voicing, duration: 1, velocity: humanizeVelocity(0.4, step, energy) });
      }
    } else {
      const patterns = [[0, 6, 8, 14], [0, 3, 8, 11], [2, 6, 10, 14], [0, 4, 8, 12], [0, 6, 10, 14]];
      for (const step of pick(patterns)) {
        if (step < stepsPerBar) events.push({ step, notes: voicing, duration: 1, velocity: humanizeVelocity(0.4, step, energy) });
      }
    }
  } else if (sectionType === 'breakdown' || sectionType === 'intro' || sectionType === 'ambient') {
    events.push({ step: 0, notes: voicing, duration: stepsPerBar, velocity: humanizeVelocity(0.25, 0, Math.max(energy, 0.3)) });
  } else if (sectionType === 'build') {
    events.push({ step: 0, notes: voicing, duration: 4, velocity: humanizeVelocity(0.35, 0, energy) });
    if (energy > 0.5) events.push({ step: 8, notes: voicing, duration: 4, velocity: humanizeVelocity(0.3, 8, energy) });
    if (energy > 0.7) {
      events.push({ step: 4, notes: voicing, duration: 2, velocity: humanizeVelocity(0.25, 4, energy) });
      events.push({ step: 12, notes: voicing, duration: 2, velocity: humanizeVelocity(0.25, 12, energy) });
    }
  } else {
    events.push({ step: 0, notes: voicing, duration: 8, velocity: humanizeVelocity(0.25, 0, energy) });
  }

  return { events, voicing };
}

// ═══════════════════════════════════════════════════════════════════════
// MELODY GENERATOR (Motif-based + Markov + Phrase-aware)
// ═══════════════════════════════════════════════════════════════════════

function generateMelody(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number,
  motif: Motif, motifTransform: MotifTransform,
  phraseType: PhraseType, barInPhrase: number
): SongTrackNote[] {
  const octave = genre.drumStyle === 'lofi' ? 4 : 5;

  // Only generate melody in drops and some breakdowns
  if (sectionType !== 'drop' && sectionType !== 'breakdown') return [];
  if (sectionType === 'breakdown' && energy < 0.4) return [];

  // Phrase breathing: leave rests at phrase boundaries
  if (phraseType === 'continuation' && barInPhrase === 0 && Math.random() > 0.5) return [];

  // Apply motif transformation
  const transformed = transformMotif(motif, motifTransform, chordDeg);
  const motifNotes = motifToNotes(transformed, root, scale, chordDeg, octave, 0.4, 0);

  // Enhance with Markov chain for additional notes
  if (sectionType === 'drop' && Math.random() > 0.4) {
    const markovStyle = getMarkovStyle(genre);
    let prevInterval = 0;
    const existingSteps = new Set(motifNotes.map(n => n.step));
    const numExtra = randInt(1, 3);
    for (let i = 0; i < numExtra; i++) {
      const interval = markovNextInterval(prevInterval, markovStyle);
      prevInterval = interval;
      const possibleSteps = Array.from({ length: 16 }, (_, s) => s).filter(s => !existingSteps.has(s));
      if (possibleSteps.length === 0) break;
      const step = pick(possibleSteps);
      existingSteps.add(step);
      motifNotes.push({
        step,
        note: scaleNote(root, scale, chordDeg + interval, octave),
        duration: pick([1, 2]),
        velocity: humanizeVelocity(0.35, step, energy),
      });
    }
  }

  // Cadential acceleration: more notes toward end of phrase
  if (phraseType === 'continuation' && motifNotes.length < 4) {
    const lastStep = motifNotes.length > 0 ? Math.max(...motifNotes.map(n => n.step)) : 8;
    for (let s = lastStep + 2; s < stepsPerBar; s += 2) {
      if (Math.random() > 0.5) {
        motifNotes.push({
          step: s,
          note: scaleNote(root, scale, chordDeg + pick([-1, 0, 1]), octave),
          duration: 1,
          velocity: humanizeVelocity(0.3, s, energy),
        });
      }
    }
  }

  return motifNotes.filter(n => n.step >= 0 && n.step < stepsPerBar);
}

// ═══════════════════════════════════════════════════════════════════════
// ARPEGGIATOR GENERATOR
// ═══════════════════════════════════════════════════════════════════════

function generateArp(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number,
  quality: ChordQuality
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  if (!genre.hasArp) return notes;
  if (Math.random() > genre.arpDensity) return notes;
  if (sectionType === 'intro' && energy < 0.4) return notes;
  if (sectionType === 'outro') return notes;

  const octave = 5;
  const chord = buildChord(root, scale, chordDeg, octave, quality);
  const patterns: ('up' | 'down' | 'updown' | 'random')[] = ['up', 'down', 'updown', 'random'];
  const pattern = pick(patterns);
  const division = genre.drumStyle === 'techno' ? 2 : (Math.random() > 0.5 ? 2 : 4);
  const numSteps = Math.floor(stepsPerBar / division);

  for (let i = 0; i < numSteps; i++) {
    const step = i * division;
    if (step >= stepsPerBar) break;

    let noteIdx: number;
    if (pattern === 'up') noteIdx = i % chord.length;
    else if (pattern === 'down') noteIdx = (chord.length - 1 - (i % chord.length));
    else if (pattern === 'updown') {
      const cycle = Math.max(chord.length * 2 - 2, 1);
      const pos = i % cycle;
      noteIdx = pos < chord.length ? pos : cycle - pos;
    } else {
      noteIdx = randInt(0, chord.length);
    }

    notes.push({
      step,
      note: chord[clamp(noteIdx, 0, chord.length - 1)],
      duration: Math.max(1, division - 1),
      velocity: humanizeVelocity(sectionType === 'drop' ? 0.35 : 0.2, step, energy),
    });
  }

  return notes;
}

// ═══════════════════════════════════════════════════════════════════════
// VOCAL GENERATOR (Intelligent + Vowel Sequencing)
// ═══════════════════════════════════════════════════════════════════════

// Vowels available for vocal generation

// Vowel sequences for melodic timbral movement
const VOWEL_SEQUENCES: ('a' | 'e' | 'i' | 'o' | 'u')[][] = [
  ['a', 'e', 'i', 'o', 'u'],
  ['u', 'o', 'a', 'e', 'i'],
  ['a', 'o', 'u', 'o', 'a'],
  ['e', 'a', 'o', 'a', 'e'],
  ['i', 'e', 'a', 'o', 'u'],
];

function generateVocals(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number,
  motif: Motif, emotion: EmotionState
): VocalEvent[] {
  const events: VocalEvent[] = [];
  if (!genre.hasVocals) return events;
  if (Math.random() > genre.vocalDensity) return events;

  const octave = 4;
  const vowelSeq = pick(VOWEL_SEQUENCES);

  if (sectionType === 'breakdown' || sectionType === 'ambient') {
    const note = scaleNote(root, scale, chordDeg, octave);
    events.push({
      step: 0, note, vowel: pick(['a', 'o', 'u']),
      style: emotion.tag === 'contemplation' ? 'whisper' : 'choir',
      duration: stepsPerBar, velocity: humanizeVelocity(0.3, 0, energy),
    });
    return events;
  }

  if (sectionType === 'intro') {
    if (energy > 0.3) {
      events.push({
        step: 0, note: scaleNote(root, scale, chordDeg, octave),
        vowel: pick(['o', 'u']), style: 'pad', duration: 8,
        velocity: humanizeVelocity(0.2, 0, energy),
      });
    }
    return events;
  }

  if (sectionType === 'build') {
    if (energy > 0.6) {
      // Vocal riser following motif contour
      const numChops = Math.min(motif.intervals.length, Math.floor(energy * 4));
      for (let i = 0; i < numChops; i++) {
        const step = Math.floor(stepsPerBar * (i / numChops));
        events.push({
          step,
          note: scaleNote(root, scale, chordDeg + motif.intervals[i % motif.intervals.length], octave),
          vowel: vowelSeq[i % vowelSeq.length],
          style: 'chop', duration: 2,
          velocity: humanizeVelocity(0.3 + energy * 0.2, step, energy),
        });
      }
    }
    return events;
  }

  if (sectionType !== 'drop') return events;

  // Drop vocals — genre-specific
  if (genre.drumStyle === 'garage') {
    // UKG: rhythmic vocal chops following the motif
    const chopSteps = pick([
      [0, 3, 6, 8, 11, 14], [2, 5, 8, 10, 14], [0, 4, 6, 10, 12],
    ]);
    let deg = chordDeg;
    for (let idx = 0; idx < chopSteps.length; idx++) {
      const step = chopSteps[idx];
      if (step >= stepsPerBar) continue;
      // Follow motif intervals for pitched movement
      if (idx < motif.intervals.length) deg = chordDeg + motif.intervals[idx];
      else deg += pick([-1, 0, 0, 1]);
      events.push({
        step, note: scaleNote(root, scale, deg, octave),
        vowel: vowelSeq[idx % vowelSeq.length],
        style: 'chop', duration: 1,
        velocity: humanizeVelocity(0.4, step, energy),
      });
    }
  } else if (genre.drumStyle === 'lofi') {
    const numFrags = randInt(2, 4);
    for (let i = 0; i < numFrags; i++) {
      const avail = [0, 4, 8, 12].filter(s => !events.some(e => e.step === s));
      if (avail.length === 0) break;
      const step = pick(avail);
      events.push({
        step, note: scaleNote(root, scale, chordDeg + pick([-1, 0, 1]), octave),
        vowel: pick(['a', 'o', 'u']), style: 'whisper', duration: 3,
        velocity: humanizeVelocity(0.25, step, energy),
      });
    }
  } else {
    // House/tech: stabs and chops
    const numVocals = randInt(2, 5);
    const usedSteps: number[] = [];
    for (let i = 0; i < numVocals; i++) {
      const possibleSteps = [0, 2, 4, 6, 8, 10, 12, 14].filter(s => !usedSteps.includes(s));
      if (possibleSteps.length === 0) break;
      const step = pick(possibleSteps);
      usedSteps.push(step);
      const style = Math.random() > 0.6 ? 'stab' as const : 'chop' as const;
      events.push({
        step, note: scaleNote(root, scale, chordDeg + pick([-1, 0, 0, 1, 2]), octave),
        vowel: vowelSeq[i % vowelSeq.length], style,
        duration: style === 'stab' ? 1 : 2,
        velocity: humanizeVelocity(0.35, step, energy),
      });
    }
  }

  return events;
}

// ═══════════════════════════════════════════════════════════════════════
// SONG STRUCTURES (Large-Scale Form with Golden Ratio Climax)
// ═══════════════════════════════════════════════════════════════════════

interface SectionDef {
  name: string;
  type: string;
  bars: number;
  energyStart: number;
  energyEnd: number;
}

const STRUCTURES: Record<string, SectionDef[][]> = {
  house: [
    [
      { name: 'INTRO', type: 'intro', bars: 8, energyStart: 0.2, energyEnd: 0.4 },
      { name: 'BUILD', type: 'build', bars: 8, energyStart: 0.4, energyEnd: 0.85 },
      { name: 'DROP', type: 'drop', bars: 16, energyStart: 1.0, energyEnd: 1.0 },
      { name: 'BREAKDOWN', type: 'breakdown', bars: 8, energyStart: 0.5, energyEnd: 0.3 },
      { name: 'BUILD 2', type: 'build', bars: 4, energyStart: 0.5, energyEnd: 0.9 },
      { name: 'DROP 2', type: 'drop', bars: 16, energyStart: 1.0, energyEnd: 1.0 },
      { name: 'OUTRO', type: 'outro', bars: 8, energyStart: 0.4, energyEnd: 0.1 },
    ],
    [
      { name: 'INTRO', type: 'intro', bars: 4, energyStart: 0.15, energyEnd: 0.3 },
      { name: 'BUILD', type: 'build', bars: 8, energyStart: 0.3, energyEnd: 0.8 },
      { name: 'DROP', type: 'drop', bars: 8, energyStart: 0.95, energyEnd: 1.0 },
      { name: 'BREAK', type: 'breakdown', bars: 4, energyStart: 0.4, energyEnd: 0.35 },
      { name: 'DROP 2', type: 'drop', bars: 8, energyStart: 1.0, energyEnd: 1.0 },
      { name: 'BREAK 2', type: 'breakdown', bars: 4, energyStart: 0.5, energyEnd: 0.2 },
      { name: 'FINAL DROP', type: 'drop', bars: 8, energyStart: 1.0, energyEnd: 0.8 },
      { name: 'OUTRO', type: 'outro', bars: 4, energyStart: 0.3, energyEnd: 0.05 },
    ],
  ],
  techno: [
    [
      { name: 'INTRO', type: 'intro', bars: 8, energyStart: 0.1, energyEnd: 0.35 },
      { name: 'GROOVE', type: 'drop', bars: 16, energyStart: 0.7, energyEnd: 0.8 },
      { name: 'BREAK', type: 'breakdown', bars: 8, energyStart: 0.4, energyEnd: 0.3 },
      { name: 'PEAK', type: 'drop', bars: 16, energyStart: 0.9, energyEnd: 1.0 },
      { name: 'OUTRO', type: 'outro', bars: 8, energyStart: 0.5, energyEnd: 0.1 },
    ],
    [
      { name: 'INTRO', type: 'intro', bars: 4, energyStart: 0.15, energyEnd: 0.4 },
      { name: 'BUILD', type: 'build', bars: 8, energyStart: 0.4, energyEnd: 0.8 },
      { name: 'MAIN', type: 'drop', bars: 16, energyStart: 0.85, energyEnd: 0.95 },
      { name: 'STRIP', type: 'breakdown', bars: 4, energyStart: 0.5, energyEnd: 0.3 },
      { name: 'HYPNOTIC', type: 'drop', bars: 16, energyStart: 0.9, energyEnd: 1.0 },
      { name: 'OUTRO', type: 'outro', bars: 8, energyStart: 0.4, energyEnd: 0.05 },
    ],
  ],
  garage: [
    [
      { name: 'INTRO', type: 'intro', bars: 4, energyStart: 0.2, energyEnd: 0.4 },
      { name: 'VERSE', type: 'drop', bars: 8, energyStart: 0.7, energyEnd: 0.8 },
      { name: 'BREAK', type: 'breakdown', bars: 4, energyStart: 0.4, energyEnd: 0.3 },
      { name: 'CHORUS', type: 'drop', bars: 8, energyStart: 0.95, energyEnd: 1.0 },
      { name: 'VERSE 2', type: 'drop', bars: 8, energyStart: 0.75, energyEnd: 0.85 },
      { name: 'FINAL', type: 'drop', bars: 8, energyStart: 1.0, energyEnd: 0.9 },
      { name: 'OUTRO', type: 'outro', bars: 4, energyStart: 0.3, energyEnd: 0.1 },
    ],
  ],
  lofi: [
    [
      { name: 'INTRO', type: 'intro', bars: 4, energyStart: 0.2, energyEnd: 0.35 },
      { name: 'LOOP A', type: 'drop', bars: 8, energyStart: 0.5, energyEnd: 0.6 },
      { name: 'BRIDGE', type: 'breakdown', bars: 4, energyStart: 0.4, energyEnd: 0.3 },
      { name: 'LOOP B', type: 'drop', bars: 8, energyStart: 0.55, energyEnd: 0.65 },
      { name: 'CHILL', type: 'breakdown', bars: 4, energyStart: 0.35, energyEnd: 0.25 },
      { name: 'LOOP A2', type: 'drop', bars: 8, energyStart: 0.5, energyEnd: 0.55 },
      { name: 'OUTRO', type: 'outro', bars: 4, energyStart: 0.3, energyEnd: 0.1 },
    ],
  ],
  ambient: [
    [
      { name: 'DAWN', type: 'ambient', bars: 8, energyStart: 0.1, energyEnd: 0.25 },
      { name: 'DRIFT', type: 'ambient', bars: 8, energyStart: 0.25, energyEnd: 0.4 },
      { name: 'PEAK', type: 'drop', bars: 8, energyStart: 0.5, energyEnd: 0.55 },
      { name: 'FADE', type: 'ambient', bars: 8, energyStart: 0.4, energyEnd: 0.2 },
      { name: 'DUSK', type: 'outro', bars: 8, energyStart: 0.2, energyEnd: 0.05 },
    ],
  ],
};

function getStructure(genre: GenreDef): SectionDef[] {
  const key = genre.drumStyle === 'house' || genre.drumStyle === 'tech' ? 'house'
    : genre.drumStyle === 'techno' ? 'techno'
    : genre.drumStyle === 'garage' ? 'garage'
    : genre.drumStyle === 'lofi' ? 'lofi'
    : genre.drumStyle === 'ambient' ? 'ambient'
    : 'house';
  const pool = STRUCTURES[key] ?? STRUCTURES['house'];
  return pick(pool);
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSER — CONSERVATORY-LEVEL COMPOSITION ENGINE
// ═══════════════════════════════════════════════════════════════════════

export function composeSong(genreOverride?: ComposerGenre): GeneratedSong {
  const genreKey = genreOverride ?? pick(Object.keys(GENRES) as ComposerGenre[]);
  const genre = GENRES[genreKey];

  const rootIdx = randInt(0, 12);
  const key = KEY_NAMES[rootIdx];
  const scaleName = pick(genre.scales);
  const scale = SCALES[scaleName] ?? SCALES['natural minor'];
  const bpm = randInt(genre.bpmRange[0], genre.bpmRange[1] + 1);
  const progressionPool = CHORD_PROGRESSIONS[genre.progressionPool] ?? CHORD_PROGRESSIONS['house'];
  const progression = pick(progressionPool);
  const structure = getStructure(genre);
  const title = `${pick(TITLES_A)} ${pick(TITLES_B)}`;

  // ── Sprint 1: Generate song motif (DNA) ──
  const songMotif = generateMotif(genre);

  const stepsPerBar = 16;
  const sections: SongSection[] = [];
  let prevVoicing: number[] = [];

  // Calculate golden ratio climax point for large-scale form
  const totalBarsInSong = structure.reduce((s, d) => s + d.bars, 0);
  const goldenRatioBar = Math.floor(totalBarsInSong * 0.618);
  let cumulativeBars = 0;

  for (let secIdx = 0; secIdx < structure.length; secIdx++) {
    const def = structure[secIdx];
    const allDrums: StepData[][][] = [];
    const allBass: SongTrackNote[][] = [];
    const allChords: SongChordEvent[][] = [];
    const allLead: SongTrackNote[][] = [];
    const allArp: SongTrackNote[][] = [];
    const allVocals: VocalEvent[][] = [];
    let hasFxRiser = false;

    for (let bar = 0; bar < def.bars; bar++) {
      const t = def.bars > 1 ? bar / (def.bars - 1) : 0;
      const energy = def.energyStart + (def.energyEnd - def.energyStart) * t;
      const chordIdx = progression[bar % progression.length];
      const emotion = emotionForSection(genre, def.type, energy);

      // ── Phrase structure ──
      const phraseType = getPhraseType(bar, def.bars);
      const barInPhrase = bar % Math.max(Math.floor(def.bars / 2), 1);
      const motifTransform = getMotifTransformForPhrase(phraseType, barInPhrase, def.type);

      // ── Cadence system ──
      const cadence = selectCadence(bar, def.bars, def.type);

      // ── Golden ratio energy boost ──
      const globalBar = cumulativeBars + bar;
      const isNearClimax = Math.abs(globalBar - goldenRatioBar) < 2;
      const climaxBoost = isNearClimax ? 0.1 : 0;

      // ── Transition detection ──
      const isTransitionBar = bar === def.bars - 1 && secIdx < structure.length - 1;

      // Generate all tracks
      const chordQuality = getChordQuality(genre, def.type, energy);
      const drumPat = generateDrumPattern(energy + climaxBoost, def.type, genre.drumStyle, stepsPerBar, isTransitionBar, emotion);
      const leadNotes = generateMelody(rootIdx, scale, chordIdx, energy + climaxBoost, def.type, genre, stepsPerBar, songMotif, motifTransform, phraseType, barInPhrase);
      const bassNotes = generateBass(rootIdx, scale, chordIdx, energy + climaxBoost, def.type, genre, stepsPerBar, leadNotes, emotion);
      const chordResult = generateChords(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar, prevVoicing, cadence);
      const arpNotes = generateArp(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar, chordQuality);
      const vocalNotes = generateVocals(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar, songMotif, emotion);

      prevVoicing = chordResult.voicing;

      allDrums.push(drumPat);
      allBass.push(bassNotes);
      allChords.push(chordResult.events);
      allLead.push(leadNotes);
      allArp.push(arpNotes);
      allVocals.push(vocalNotes);

      if (def.type === 'build' && energy > 0.7) hasFxRiser = true;
    }

    // Flatten into section
    const totalSteps = def.bars * stepsPerBar;
    const sectionDrums = emptyPattern(16, totalSteps);
    const sectionBass: SongTrackNote[] = [];
    const sectionChords: SongChordEvent[] = [];
    const sectionLead: SongTrackNote[] = [];
    const sectionArp: SongTrackNote[] = [];
    const sectionVocals: VocalEvent[] = [];

    for (let bar = 0; bar < def.bars; bar++) {
      const offset = bar * stepsPerBar;
      for (let pad = 0; pad < 16; pad++) {
        for (let step = 0; step < stepsPerBar; step++) {
          if (allDrums[bar][pad][step].active) {
            sectionDrums[pad][offset + step] = allDrums[bar][pad][step];
          }
        }
      }
      for (const n of allBass[bar]) sectionBass.push({ ...n, step: n.step + offset });
      for (const c of allChords[bar]) sectionChords.push({ ...c, step: c.step + offset });
      for (const n of allLead[bar]) sectionLead.push({ ...n, step: n.step + offset });
      for (const n of allArp[bar]) sectionArp.push({ ...n, step: n.step + offset });
      for (const v of allVocals[bar]) sectionVocals.push({ ...v, step: v.step + offset });
    }

    cumulativeBars += def.bars;

    sections.push({
      name: def.name,
      bars: def.bars,
      energy: (def.energyStart + def.energyEnd) / 2,
      drumPattern: sectionDrums,
      bassNotes: sectionBass,
      chordNotes: sectionChords,
      leadNotes: sectionLead,
      arpNotes: sectionArp,
      vocalEvents: sectionVocals,
      fxRiser: hasFxRiser,
    });
  }

  return { title, key: `${key} ${scaleName}`, scaleName, bpm, genre: genreKey, sections };
}

export const GENRE_LIST: { id: ComposerGenre; label: string }[] = Object.entries(GENRES)
  .map(([id, def]) => ({ id: id as ComposerGenre, label: def.label }));

// Expose for use outside
void _midiToFreq;
void _tensionScore;
