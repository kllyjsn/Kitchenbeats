import type { StepData, SongSection, SongTrackNote, SongChordEvent, VocalEvent, GeneratedSong, ComposerGenre } from '../types';

// ── Music Theory Database ───────────────────────────────────────────────

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

const CHORD_PROGRESSIONS: Record<string, number[][]> = {
  // House / Electronic
  house: [
    [0, 5, 2, 6],     // i-VI-III-VII (Am F C G)
    [0, 3, 5, 6],     // i-iv-VI-VII (Am Dm F G)
    [0, 2, 6, 3],     // i-III-VII-iv
    [0, 6, 5, 6],     // i-VII-VI-VII
    [0, 5, 3, 6],     // i-VI-iv-VII — emotional
    [0, 2, 3, 5],     // i-III-iv-VI — Fred Again
    [0, 5, 0, 6],     // i-VI-i-VII — minimal
  ],
  // Acid / Techno
  acid: [
    [0, 0, 3, 3],     // i-i-iv-iv — hypnotic
    [0, 6, 0, 5],     // i-VII-i-VI — driving
    [0, 0, 0, 6],     // i-i-i-VII — minimal tension
    [0, 3, 0, 3],     // i-iv-i-iv — relentless
  ],
  // Lo-fi / Hip Hop
  lofi: [
    [0, 2, 3, 4],     // i-III-iv-v — jazzy
    [0, 5, 3, 2],     // i-VI-iv-III — sad
    [0, 4, 5, 3],     // i-v-VI-iv — dreamy
    [2, 0, 5, 3],     // III-i-VI-iv — neo-soul
    [0, 3, 6, 2],     // i-iv-VII-III — chill
  ],
  // Ambient
  ambient: [
    [0, 5, 2, 0],     // i-VI-III-i — floating
    [0, 2, 5, 0],     // i-III-VI-i — ethereal
    [0, 0, 5, 5],     // i-i-VI-VI — glacial
  ],
  // UK Garage
  garage: [
    [0, 5, 2, 6],     // i-VI-III-VII — classic 2-step
    [0, 2, 3, 6],     // i-III-iv-VII — skippy
    [5, 0, 6, 2],     // VI-i-VII-III — bright
    [0, 3, 5, 2],     // i-iv-VI-III — warm
  ],
};

// ── Genre Definitions ───────────────────────────────────────────────────

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
}

const GENRES: Record<ComposerGenre, GenreDef> = {
  deep_house: {
    label: 'Deep House', bpmRange: [120, 126], scales: ['dorian', 'natural minor', 'minor pentatonic'],
    progressionPool: 'house', bassPreset: 0, chordPreset: 3, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.6, hasArp: true, arpDensity: 0.4,
    drumStyle: 'house', swing: 0.05,
  },
  tech_house: {
    label: 'Tech House', bpmRange: [124, 130], scales: ['natural minor', 'dorian', 'phrygian'],
    progressionPool: 'house', bassPreset: 1, chordPreset: 6, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.3, hasArp: true, arpDensity: 0.6,
    drumStyle: 'tech', swing: 0,
  },
  uk_garage: {
    label: 'UK Garage', bpmRange: [130, 138], scales: ['natural minor', 'dorian', 'minor pentatonic'],
    progressionPool: 'garage', bassPreset: 0, chordPreset: 3, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.8, hasArp: false, arpDensity: 0,
    drumStyle: 'garage', swing: 0.12,
  },
  acid_techno: {
    label: 'Acid Techno', bpmRange: [130, 140], scales: ['phrygian', 'natural minor', 'blues'],
    progressionPool: 'acid', bassPreset: 2, chordPreset: 6, leadPreset: 2,
    hasVocals: false, vocalDensity: 0, hasArp: true, arpDensity: 0.8,
    drumStyle: 'techno', swing: 0,
  },
  lo_fi_hip_hop: {
    label: 'Lo-Fi Hip Hop', bpmRange: [75, 90], scales: ['dorian', 'minor pentatonic', 'blues', 'melodic minor'],
    progressionPool: 'lofi', bassPreset: 0, chordPreset: 3, leadPreset: 7,
    hasVocals: true, vocalDensity: 0.2, hasArp: false, arpDensity: 0,
    drumStyle: 'lofi', swing: 0.15,
  },
  ambient: {
    label: 'Ambient', bpmRange: [70, 100], scales: ['lydian', 'whole tone', 'major pentatonic', 'mixolydian'],
    progressionPool: 'ambient', bassPreset: 0, chordPreset: 3, leadPreset: 4,
    hasVocals: true, vocalDensity: 0.15, hasArp: true, arpDensity: 0.3,
    drumStyle: 'ambient', swing: 0.08,
  },
  classic_house: {
    label: 'Classic House', bpmRange: [118, 125], scales: ['natural minor', 'dorian'],
    progressionPool: 'house', bassPreset: 0, chordPreset: 3, leadPreset: 7,
    hasVocals: true, vocalDensity: 0.5, hasArp: true, arpDensity: 0.3,
    drumStyle: 'house', swing: 0.03,
  },
  minimal_techno: {
    label: 'Minimal Techno', bpmRange: [126, 134], scales: ['phrygian', 'natural minor', 'diminished'],
    progressionPool: 'acid', bassPreset: 1, chordPreset: 6, leadPreset: 2,
    hasVocals: false, vocalDensity: 0, hasArp: true, arpDensity: 0.5,
    drumStyle: 'techno', swing: 0,
  },
};

// ── Song Titles ─────────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max)); }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

function scaleNote(root: number, scale: number[], degree: number, octave: number): number {
  const oct = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return root + (octave + oct) * 12 + scale[idx];
}

function buildTriad(root: number, scale: number[], degree: number, octave: number): number[] {
  return [
    scaleNote(root, scale, degree, octave),
    scaleNote(root, scale, degree + 2, octave),
    scaleNote(root, scale, degree + 4, octave),
  ];
}

function buildSeventh(root: number, scale: number[], degree: number, octave: number): number[] {
  return [
    scaleNote(root, scale, degree, octave),
    scaleNote(root, scale, degree + 2, octave),
    scaleNote(root, scale, degree + 4, octave),
    scaleNote(root, scale, degree + 6, octave),
  ];
}

function emptyPattern(pads: number, steps: number): StepData[][] {
  return Array.from({ length: pads }, () =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0 }))
  );
}

// ── Drum Pattern Generator (Genre-aware) ────────────────────────────────

function generateDrumPattern(
  energy: number, sectionType: string, drumStyle: string, stepsPerBar: number = 16
): StepData[][] {
  const pat = emptyPattern(16, stepsPerBar);
  const hit = (pad: number, step: number, vel: number) => {
    if (step >= 0 && step < stepsPerBar) {
      pat[pad][step] = { active: true, velocity: clamp(vel + rand(-0.04, 0.04), 0.15, 1) };
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
    if (energy > 0.2) {
      hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25);
    }
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

  // ── Build and Drop patterns per genre ──

  if (drumStyle === 'house' || drumStyle === 'tech') {
    // Four-on-floor
    hit(0, 0, 0.9); hit(0, 4, 0.85); hit(0, 8, 0.9); hit(0, 12, 0.85);

    if (sectionType === 'build') {
      hit(3, 2, 0.4); hit(3, 6, 0.35); hit(3, 10, 0.4); hit(3, 14, 0.35);
      if (energy > 0.5) { hit(2, 4, 0.5); hit(2, 12, 0.5); }
      if (energy > 0.7) {
        hit(1, 8, 0.3); hit(1, 10, 0.35); hit(1, 12, 0.4);
        hit(1, 13, 0.5); hit(1, 14, 0.6); hit(1, 15, 0.7);
      }
    } else { // drop
      hit(2, 4, 0.7); hit(2, 12, 0.7);
      // Closed hats — every 8th
      for (let i = 0; i < 16; i += 2) hit(3, i, i % 4 === 0 ? 0.35 : 0.5);
      hit(4, 6, 0.5); hit(4, 14, 0.45);
      if (drumStyle === 'tech') {
        // Extra percussion
        hit(5, 3, 0.3); hit(5, 11, 0.3);
        if (Math.random() > 0.5) { hit(8, 2, 0.25); hit(8, 10, 0.25); }
      }
      if (Math.random() > 0.4) {
        hit(10, 0, 0.3); hit(10, 4, 0.25); hit(10, 8, 0.3); hit(10, 12, 0.25);
      }
      if (Math.random() > 0.3) { hit(0, pick([3, 7, 11, 15]), 0.35); }
      if (Math.random() > 0.5) {
        hit(11, 2, 0.25); hit(11, 6, 0.2); hit(11, 10, 0.25); hit(11, 14, 0.2);
      }
    }
  } else if (drumStyle === 'garage') {
    // 2-step pattern — shuffled kick, no straight four-on-floor
    const kickPatterns = [
      [0, 6, 10],
      [0, 3, 10],
      [0, 7, 10, 14],
      [0, 5, 10],
    ];
    for (const s of pick(kickPatterns)) hit(0, s, 0.8);
    hit(2, 4, 0.65); hit(2, 12, 0.65); // clap
    // Syncopated hats
    hit(3, 0, 0.35); hit(3, 2, 0.5); hit(3, 4, 0.3); hit(3, 6, 0.5);
    hit(3, 8, 0.35); hit(3, 10, 0.5); hit(3, 12, 0.3); hit(3, 14, 0.5);
    hit(4, pick([3, 7, 11]), 0.45);
    if (sectionType === 'drop') {
      hit(11, 1, 0.2); hit(11, 5, 0.15); hit(11, 9, 0.2); hit(11, 13, 0.15);
    }
  } else if (drumStyle === 'techno') {
    // Hard four-on-floor, sparse percussion
    hit(0, 0, 0.95); hit(0, 4, 0.9); hit(0, 8, 0.95); hit(0, 12, 0.9);
    hit(2, 4, 0.6); hit(2, 12, 0.6);
    hit(3, 2, 0.5); hit(3, 6, 0.45); hit(3, 10, 0.5); hit(3, 14, 0.45);
    if (sectionType === 'drop') {
      hit(4, 6, 0.55); hit(4, 14, 0.5);
      if (Math.random() > 0.5) { hit(5, 3, 0.3); hit(5, 11, 0.3); }
      // 16th hat pattern variation
      if (Math.random() > 0.6) {
        for (let i = 0; i < 16; i++) hit(3, i, 0.25 + (i % 2) * 0.15);
      }
    }
    if (sectionType === 'build' && energy > 0.7) {
      for (let i = 8; i < 16; i++) hit(3, i, 0.3 + (i - 8) * 0.04);
    }
  } else if (drumStyle === 'lofi') {
    // Boom-bap influenced
    const kickPatterns = [
      [0, 5, 8, 13],
      [0, 3, 8, 11],
      [0, 6, 8, 14],
      [0, 4, 10, 14],
    ];
    for (const s of pick(kickPatterns)) hit(0, s, 0.7);
    hit(1, 4, 0.55); hit(1, 12, 0.55);
    // Lazy hats
    hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25);
    if (Math.random() > 0.4) { hit(3, 0, 0.2); hit(3, 8, 0.2); }
    if (Math.random() > 0.6) { hit(4, pick([7, 15]), 0.3); }
    if (Math.random() > 0.5) { hit(11, 2, 0.15); hit(11, 10, 0.15); }
  } else if (drumStyle === 'ambient') {
    if (energy > 0.3) { hit(0, 0, 0.3); }
    if (energy > 0.4) {
      hit(3, 4, 0.2); hit(3, 12, 0.2);
      if (Math.random() > 0.5) hit(5, 8, 0.2);
    }
    if (energy > 0.6) { hit(10, 0, 0.15); hit(10, 8, 0.15); }
  }

  // Crash on first beat of drop
  if (sectionType === 'drop' && Math.random() > 0.3) hit(9, 0, 0.45);

  return pat;
}

// ── Bass Generator (Genre-aware) ────────────────────────────────────────

function generateBass(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number
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
      // Boom-bap bass — follows kick pattern loosely
      const patterns = [[0, 5, 8, 13], [0, 3, 8, 11], [0, 6, 8, 14]];
      const pat = pick(patterns);
      for (const s of pat) {
        const oct = Math.random() > 0.7 ? 12 : 0;
        notes.push({ step: s, note: rootNote + oct, duration: 2, velocity: 0.65 });
      }
    } else if (isAcid) {
      // Acid 303 — 16th note patterns with slides
      const density = Math.random() > 0.5 ? 8 : 6;
      for (let i = 0; i < density; i++) {
        const step = isAcid ? i * 2 : pick([0, 2, 3, 6, 8, 10, 11, 14]);
        if (step < stepsPerBar) {
          const deg = chordDeg + pick([-2, -1, 0, 0, 0, 1, 2]);
          notes.push({
            step,
            note: scaleNote(root, scale, deg, baseOctave) + (Math.random() > 0.7 ? 12 : 0),
            duration: 1,
            velocity: 0.5 + rand(0, 0.3),
          });
        }
      }
    } else {
      // Standard syncopated bass
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
            velocity: step === 0 ? 0.8 : 0.6 + rand(0, 0.15),
          });
        }
      }
    }
  } else if (sectionType === 'build') {
    notes.push({ step: 0, note: rootNote, duration: 4, velocity: 0.6 * energy });
    if (energy > 0.6) notes.push({ step: 8, note: rootNote, duration: 3, velocity: 0.5 * energy });
  } else {
    notes.push({ step: 0, note: rootNote, duration: 8, velocity: 0.5 * energy });
  }

  return notes;
}

// ── Chord Generator (Genre-aware) ───────────────────────────────────────

function generateChords(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number
): SongChordEvent[] {
  const events: SongChordEvent[] = [];
  const octave = 4;
  const useSevenths = genre.drumStyle === 'lofi' || genre.drumStyle === 'garage';
  const chord = useSevenths
    ? buildSeventh(root, scale, chordDeg, octave)
    : buildTriad(root, scale, chordDeg, octave);

  if (sectionType === 'intro' && energy < 0.3) return events;

  if (sectionType === 'drop') {
    if (genre.drumStyle === 'lofi') {
      // Jazzy sustained chords
      events.push({ step: 0, notes: chord, duration: 8, velocity: 0.3 });
      if (Math.random() > 0.5) {
        events.push({ step: 8, notes: chord, duration: 6, velocity: 0.25 });
      }
    } else if (genre.drumStyle === 'garage') {
      // Offbeat stabs — classic UKG
      const patterns = [[1, 5, 9, 13], [2, 6, 10, 14], [1, 3, 9, 11]];
      for (const step of pick(patterns)) {
        if (step < stepsPerBar) {
          events.push({ step, notes: chord, duration: 1, velocity: 0.4 });
        }
      }
    } else {
      // Rhythmic stabs
      const patterns = [
        [0, 6, 8, 14], [0, 3, 8, 11], [2, 6, 10, 14],
        [0, 4, 8, 12], [0, 6, 10, 14],
      ];
      for (const step of pick(patterns)) {
        if (step < stepsPerBar) {
          events.push({ step, notes: chord, duration: 1, velocity: 0.4 + rand(0, 0.15) });
        }
      }
    }
  } else if (sectionType === 'breakdown' || sectionType === 'intro' || sectionType === 'ambient') {
    events.push({ step: 0, notes: chord, duration: stepsPerBar, velocity: 0.25 * Math.max(energy, 0.3) });
  } else if (sectionType === 'build') {
    events.push({ step: 0, notes: chord, duration: 4, velocity: 0.35 * energy });
    if (energy > 0.5) events.push({ step: 8, notes: chord, duration: 4, velocity: 0.3 * energy });
    if (energy > 0.7) {
      events.push({ step: 4, notes: chord, duration: 2, velocity: 0.25 * energy });
      events.push({ step: 12, notes: chord, duration: 2, velocity: 0.25 * energy });
    }
  } else {
    events.push({ step: 0, notes: chord, duration: 8, velocity: 0.25 * energy });
  }

  return events;
}

// ── Melody Generator ────────────────────────────────────────────────────

function generateMelody(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  const octave = genre.drumStyle === 'lofi' ? 4 : 5;

  if (sectionType !== 'drop' && sectionType !== 'breakdown') return notes;
  if (sectionType === 'breakdown' && energy < 0.4) return notes;
  if (Math.random() > 0.75 && sectionType === 'drop') return notes;

  const pentatonic = [0, 3, 5, 7, 10];
  const usedScale = Math.random() > 0.3 ? pentatonic : scale;

  let currentDegree = chordDeg;
  const numNotes = sectionType === 'drop' ? randInt(3, 7) : randInt(2, 4);

  const positions: number[] = [];
  const possibleSteps = genre.drumStyle === 'lofi'
    ? [0, 2, 4, 6, 8, 10, 12, 14]
    : sectionType === 'drop'
      ? [0, 2, 3, 4, 6, 8, 10, 12, 14]
      : [0, 4, 8, 12];

  for (let i = 0; i < numNotes; i++) {
    const avail = possibleSteps.filter(s => !positions.includes(s));
    if (avail.length === 0) break;
    positions.push(pick(avail));
  }
  positions.sort((a, b) => a - b);

  for (const step of positions) {
    if (step >= stepsPerBar) continue;
    const motion = pick([-2, -1, -1, 0, 1, 1, 2]);
    currentDegree = clamp(currentDegree + motion, 0, usedScale.length * 2 - 1);
    notes.push({
      step,
      note: scaleNote(root, usedScale, currentDegree, octave),
      duration: pick([1, 2, 2, 3]),
      velocity: 0.35 + rand(0, 0.2) * energy,
    });
  }

  return notes;
}

// ── Arpeggiator Generator ───────────────────────────────────────────────

function generateArp(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  if (!genre.hasArp) return notes;
  if (Math.random() > genre.arpDensity) return notes;
  if (sectionType === 'intro' && energy < 0.4) return notes;
  if (sectionType === 'outro') return notes;

  const octave = 5;
  const triad = buildTriad(root, scale, chordDeg, octave);
  const patterns: string[] = ['up', 'down', 'updown', 'random'];
  const pattern = pick(patterns);

  const division = genre.drumStyle === 'techno' ? 2 : (Math.random() > 0.5 ? 2 : 4);
  const numSteps = Math.floor(stepsPerBar / division);

  for (let i = 0; i < numSteps; i++) {
    const step = i * division;
    if (step >= stepsPerBar) break;

    let noteIdx: number;
    if (pattern === 'up') noteIdx = i % triad.length;
    else if (pattern === 'down') noteIdx = (triad.length - 1 - (i % triad.length));
    else if (pattern === 'updown') {
      const cycle = triad.length * 2 - 2;
      const pos = i % cycle;
      noteIdx = pos < triad.length ? pos : cycle - pos;
    } else {
      noteIdx = randInt(0, triad.length);
    }

    const vel = sectionType === 'drop'
      ? 0.35 + rand(0, 0.15) * energy
      : 0.2 + rand(0, 0.1) * energy;

    notes.push({
      step,
      note: triad[noteIdx],
      duration: Math.max(1, division - 1),
      velocity: vel,
    });
  }

  return notes;
}

// ── Vocal Generator ─────────────────────────────────────────────────────

const VOWELS: ('a' | 'e' | 'i' | 'o' | 'u')[] = ['a', 'e', 'i', 'o', 'u'];

function generateVocals(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, genre: GenreDef, stepsPerBar: number
): VocalEvent[] {
  const events: VocalEvent[] = [];
  if (!genre.hasVocals) return events;
  if (Math.random() > genre.vocalDensity) return events;

  const octave = 4;

  if (sectionType === 'breakdown' || sectionType === 'ambient') {
    // Choir pad
    const note = scaleNote(root, scale, chordDeg, octave);
    events.push({
      step: 0, note, vowel: pick(['a', 'o', 'u']),
      style: 'choir', duration: stepsPerBar, velocity: 0.3 * energy,
    });
    return events;
  }

  if (sectionType === 'intro') {
    if (energy > 0.3) {
      events.push({
        step: 0,
        note: scaleNote(root, scale, chordDeg, octave),
        vowel: pick(['o', 'u']),
        style: 'pad',
        duration: 8,
        velocity: 0.2,
      });
    }
    return events;
  }

  if (sectionType === 'build') {
    if (energy > 0.6) {
      // Vocal riser — notes ascending
      const numChops = Math.floor(energy * 4);
      for (let i = 0; i < numChops; i++) {
        const step = Math.floor(stepsPerBar * (i / numChops));
        events.push({
          step,
          note: scaleNote(root, scale, chordDeg + i, octave),
          vowel: pick(VOWELS),
          style: 'chop',
          duration: 2,
          velocity: 0.3 + energy * 0.2,
        });
      }
    }
    return events;
  }

  if (sectionType !== 'drop') return events;

  // Drop vocals — chops, stabs, whispers
  if (genre.drumStyle === 'garage') {
    // UKG vocal chops — rhythmic and syncopated
    const chopSteps = pick([
      [0, 3, 6, 8, 11, 14],
      [2, 5, 8, 10, 14],
      [0, 4, 6, 10, 12],
    ]);
    let deg = chordDeg;
    for (const step of chopSteps) {
      if (step >= stepsPerBar) continue;
      deg += pick([-1, 0, 0, 1]);
      events.push({
        step,
        note: scaleNote(root, scale, deg, octave),
        vowel: pick(VOWELS),
        style: 'chop',
        duration: 1,
        velocity: 0.4 + rand(0, 0.15),
      });
    }
  } else if (genre.drumStyle === 'lofi') {
    // Lo-fi vocal texture — whispered fragments
    const numFrags = randInt(2, 4);
    for (let i = 0; i < numFrags; i++) {
      const step = pick([0, 4, 8, 12].filter(s => !events.some(e => e.step === s)));
      if (step === undefined) break;
      events.push({
        step,
        note: scaleNote(root, scale, chordDeg + pick([-1, 0, 1]), octave),
        vowel: pick(['a', 'o', 'u']),
        style: 'whisper',
        duration: 3,
        velocity: 0.25,
      });
    }
  } else {
    // House/tech vocal stabs and chops
    const numVocals = randInt(2, 5);
    const usedSteps: number[] = [];
    for (let i = 0; i < numVocals; i++) {
      const possibleSteps = [0, 2, 4, 6, 8, 10, 12, 14].filter(s => !usedSteps.includes(s));
      if (possibleSteps.length === 0) break;
      const step = pick(possibleSteps);
      usedSteps.push(step);
      const style = Math.random() > 0.6 ? 'stab' as const : 'chop' as const;
      events.push({
        step,
        note: scaleNote(root, scale, chordDeg + pick([-1, 0, 0, 1, 2]), octave),
        vowel: pick(VOWELS),
        style,
        duration: style === 'stab' ? 1 : 2,
        velocity: 0.35 + rand(0, 0.2),
      });
    }
  }

  return events;
}

// ── Song Structures per Genre ───────────────────────────────────────────

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

// ── Main Composer ───────────────────────────────────────────────────────

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

  const stepsPerBar = 16;
  const sections: SongSection[] = [];

  for (const def of structure) {
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

      allDrums.push(generateDrumPattern(energy, def.type, genre.drumStyle, stepsPerBar));
      allBass.push(generateBass(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar));
      allChords.push(generateChords(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar));
      allLead.push(generateMelody(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar));
      allArp.push(generateArp(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar));
      allVocals.push(generateVocals(rootIdx, scale, chordIdx, energy, def.type, genre, stepsPerBar));

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
