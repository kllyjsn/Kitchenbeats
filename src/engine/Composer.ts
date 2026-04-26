import type { StepData, SongSection, SongTrackNote, SongChordEvent, GeneratedSong } from '../types';

// ── Music Theory ────────────────────────────────────────────────────────

const SCALES: Record<string, number[]> = {
  'natural minor':  [0, 2, 3, 5, 7, 8, 10],
  'dorian':         [0, 2, 3, 5, 7, 9, 10],
  'phrygian':       [0, 1, 3, 5, 7, 8, 10],
  'minor pentatonic': [0, 3, 5, 7, 10],
};

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_PROGRESSIONS = [
  // i - VI - III - VII (Am F C G) — classic house
  [0, 5, 2, 6],
  // i - iv - VI - VII (Am Dm F G)
  [0, 3, 5, 6],
  // i - III - VII - iv (Am C G Dm)
  [0, 2, 6, 3],
  // i - VII - VI - VII (Am G F G)
  [0, 6, 5, 6],
  // i - iv - v - i (Am Dm Em Am)
  [0, 3, 4, 0],
  // i - VI - iv - VII (Am F Dm G) — emotional build
  [0, 5, 3, 6],
  // i - III - iv - VI (Am C Dm F) — Fred Again style
  [0, 2, 3, 5],
];

const SONG_TITLES_A = [
  'Midnight', 'Golden', 'Deep', 'Lost', 'Neon', 'Velvet', 'Crystal',
  'Shadow', 'Electric', 'Infinite', 'Sacred', 'Liquid', 'Broken',
  'Floating', 'Burning', 'Frozen', 'Silent', 'Rising', 'Falling',
];

const SONG_TITLES_B = [
  'Groove', 'Horizon', 'Pulse', 'Wave', 'Dream', 'Rain', 'Fire',
  'Dawn', 'Echo', 'Signal', 'Light', 'Storm', 'Drift', 'Rush',
  'Bloom', 'Haze', 'Flow', 'Dust', 'Glow', 'Tide',
];

// ── Helpers ─────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

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

// ── Drum Pattern Generator ──────────────────────────────────────────────

function emptyPattern(pads: number, steps: number): StepData[][] {
  return Array.from({ length: pads }, () =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 0 }))
  );
}

function generateDrumPattern(energy: number, sectionType: string, stepsPerBar: number = 16): StepData[][] {
  const pat = emptyPattern(16, stepsPerBar);

  const hit = (pad: number, step: number, vel: number) => {
    if (step < stepsPerBar) {
      pat[pad][step] = { active: true, velocity: clamp(vel + rand(-0.05, 0.05), 0.2, 1) };
    }
  };

  // Pad mapping: 0=kick, 1=snare, 2=clap, 3=closedHat, 4=openHat,
  //              5=rim, 8=cowbell, 9=crash, 10=ride, 11=shaker

  if (sectionType === 'intro') {
    // Sparse atmospheric intro
    if (energy > 0.2) {
      hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25);
    }
    if (energy > 0.4) {
      hit(0, 0, 0.5); hit(0, 8, 0.4);
    }
    if (energy > 0.5) {
      hit(5, 4, 0.3); hit(5, 12, 0.3);
    }
  } else if (sectionType === 'build') {
    // Four-on-floor building
    hit(0, 0, 0.7); hit(0, 4, 0.6); hit(0, 8, 0.7); hit(0, 12, 0.6);
    hit(3, 2, 0.4); hit(3, 6, 0.35); hit(3, 10, 0.4); hit(3, 14, 0.35);

    if (energy > 0.5) {
      hit(2, 4, 0.5); hit(2, 12, 0.5);
      hit(3, 0, 0.25); hit(3, 4, 0.25); hit(3, 8, 0.25); hit(3, 12, 0.25);
    }
    if (energy > 0.7) {
      // Snare roll building tension
      hit(1, 8, 0.3); hit(1, 10, 0.35); hit(1, 12, 0.4); hit(1, 13, 0.5);
      hit(1, 14, 0.6); hit(1, 15, 0.7);
    }
    if (energy > 0.8) {
      hit(9, 0, 0.4); // crash anticipation
    }
  } else if (sectionType === 'drop') {
    // Full energy four-on-floor
    hit(0, 0, 0.9); hit(0, 4, 0.85); hit(0, 8, 0.9); hit(0, 12, 0.85);
    hit(2, 4, 0.7); hit(2, 12, 0.7); // clap
    hit(3, 0, 0.35); hit(3, 2, 0.5); hit(3, 4, 0.35); hit(3, 6, 0.5);
    hit(3, 8, 0.35); hit(3, 10, 0.5); hit(3, 12, 0.35); hit(3, 14, 0.5);
    hit(4, 6, 0.5); hit(4, 14, 0.45); // open hat

    if (Math.random() > 0.4) {
      hit(10, 0, 0.3); hit(10, 4, 0.25); hit(10, 8, 0.3); hit(10, 12, 0.25); // ride
    }
    if (Math.random() > 0.5) {
      hit(11, 2, 0.25); hit(11, 6, 0.2); hit(11, 10, 0.25); hit(11, 14, 0.2); // shaker
    }
    // Ghost kicks for groove
    if (Math.random() > 0.3) {
      const ghost = pick([3, 7, 11, 15]);
      hit(0, ghost, 0.35);
    }
  } else if (sectionType === 'breakdown') {
    // Stripped back — hats and rim only
    hit(3, 2, 0.3); hit(3, 6, 0.25); hit(3, 10, 0.3); hit(3, 14, 0.25);
    if (energy > 0.3) {
      hit(5, 4, 0.25); hit(5, 12, 0.25);
    }
    if (energy > 0.5) {
      hit(11, 0, 0.2); hit(11, 4, 0.15); hit(11, 8, 0.2); hit(11, 12, 0.15);
    }
  } else if (sectionType === 'outro') {
    // Winding down
    if (energy > 0.2) {
      hit(0, 0, 0.5 * energy); hit(0, 8, 0.4 * energy);
      hit(3, 2, 0.3 * energy); hit(3, 6, 0.25 * energy);
      hit(3, 10, 0.3 * energy); hit(3, 14, 0.25 * energy);
    }
  }

  return pat;
}

// ── Bass Generator ──────────────────────────────────────────────────────

function generateBass(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, stepsPerBar: number
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  const baseOctave = 2;
  const rootNote = scaleNote(root, scale, chordDeg, baseOctave);

  if (sectionType === 'intro' && energy < 0.4) return notes;
  if (sectionType === 'breakdown' && energy < 0.5) return notes;

  if (sectionType === 'drop') {
    // Driving bass — on every beat with syncopation
    const patterns = [
      [0, 3, 6, 10],       // syncopated
      [0, 4, 8, 12],       // straight
      [0, 3, 8, 11],       // offbeat groove
      [0, 6, 8, 14],       // Fred Again bounce
    ];
    const pattern = pick(patterns);
    for (const step of pattern) {
      if (step < stepsPerBar) {
        const octShift = step === 0 ? 0 : (Math.random() > 0.7 ? 12 : 0);
        notes.push({
          step,
          note: rootNote + octShift,
          duration: step === 0 ? 3 : 2,
          velocity: step === 0 ? 0.8 : 0.6 + rand(0, 0.15),
        });
      }
    }
  } else if (sectionType === 'build') {
    // Simpler bass, building
    notes.push({ step: 0, note: rootNote, duration: 4, velocity: 0.6 * energy });
    if (energy > 0.6) {
      notes.push({ step: 8, note: rootNote, duration: 3, velocity: 0.5 * energy });
    }
  } else {
    // Sustained root
    notes.push({ step: 0, note: rootNote, duration: 8, velocity: 0.5 * energy });
  }

  return notes;
}

// ── Chord Generator ─────────────────────────────────────────────────────

function generateChords(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, stepsPerBar: number
): SongChordEvent[] {
  const events: SongChordEvent[] = [];
  const octave = 4;
  const triad = buildTriad(root, scale, chordDeg, octave);

  if (sectionType === 'intro' && energy < 0.3) return events;

  if (sectionType === 'drop') {
    // Rhythmic stabs
    const patterns = [
      [0, 6, 8, 14],
      [0, 3, 8, 11],
      [2, 6, 10, 14],
    ];
    const pat = pick(patterns);
    for (const step of pat) {
      if (step < stepsPerBar) {
        events.push({
          step,
          notes: triad,
          duration: 1,
          velocity: 0.4 + rand(0, 0.15),
        });
      }
    }
  } else if (sectionType === 'breakdown' || sectionType === 'intro') {
    // Sustained pad
    events.push({
      step: 0,
      notes: triad,
      duration: stepsPerBar,
      velocity: 0.3 * energy,
    });
  } else if (sectionType === 'build') {
    // Pulsing
    events.push({ step: 0, notes: triad, duration: 4, velocity: 0.35 * energy });
    if (energy > 0.5) {
      events.push({ step: 8, notes: triad, duration: 4, velocity: 0.3 * energy });
    }
    if (energy > 0.7) {
      events.push({ step: 4, notes: triad, duration: 2, velocity: 0.25 * energy });
      events.push({ step: 12, notes: triad, duration: 2, velocity: 0.25 * energy });
    }
  } else {
    events.push({ step: 0, notes: triad, duration: 8, velocity: 0.25 * energy });
  }

  return events;
}

// ── Melody Generator ────────────────────────────────────────────────────

function generateMelody(
  root: number, scale: number[], chordDeg: number, energy: number,
  sectionType: string, stepsPerBar: number
): SongTrackNote[] {
  const notes: SongTrackNote[] = [];
  const octave = 5;

  // Only generate melody in drops and some breakdowns
  if (sectionType !== 'drop' && sectionType !== 'breakdown') return notes;
  if (sectionType === 'breakdown' && energy < 0.4) return notes;
  if (Math.random() > 0.8 && sectionType === 'drop') return notes; // some drops are instrumental

  // Use pentatonic for safer melodies
  const pentatonic = [0, 3, 5, 7, 10];
  const usedScale = Math.random() > 0.3 ? pentatonic : scale;

  let currentDegree = chordDeg;
  const numNotes = sectionType === 'drop' ? randInt(3, 6) : randInt(2, 4);

  // Generate rhythmic positions
  const positions: number[] = [];
  const possibleSteps = sectionType === 'drop'
    ? [0, 2, 3, 4, 6, 8, 10, 12, 14]
    : [0, 4, 8, 12];

  for (let i = 0; i < numNotes; i++) {
    const step = pick(possibleSteps.filter(s => !positions.includes(s)));
    if (step !== undefined) positions.push(step);
  }
  positions.sort((a, b) => a - b);

  for (const step of positions) {
    if (step >= stepsPerBar) continue;

    // Melodic motion — prefer small intervals
    const motion = pick([-2, -1, -1, 0, 1, 1, 2]);
    currentDegree = clamp(currentDegree + motion, 0, usedScale.length * 2 - 1);
    const note = scaleNote(root, usedScale, currentDegree, octave);

    notes.push({
      step,
      note,
      duration: pick([1, 2, 2, 3]),
      velocity: 0.35 + rand(0, 0.2) * energy,
    });
  }

  return notes;
}

// ── Section Generator ───────────────────────────────────────────────────

interface SectionDef {
  name: string;
  type: string;
  bars: number;
  energyStart: number;
  energyEnd: number;
}

const SONG_STRUCTURES: SectionDef[][] = [
  // Classic house structure
  [
    { name: 'INTRO', type: 'intro', bars: 8, energyStart: 0.2, energyEnd: 0.4 },
    { name: 'BUILD', type: 'build', bars: 8, energyStart: 0.4, energyEnd: 0.85 },
    { name: 'DROP', type: 'drop', bars: 16, energyStart: 1.0, energyEnd: 1.0 },
    { name: 'BREAKDOWN', type: 'breakdown', bars: 8, energyStart: 0.5, energyEnd: 0.3 },
    { name: 'BUILD 2', type: 'build', bars: 4, energyStart: 0.5, energyEnd: 0.9 },
    { name: 'DROP 2', type: 'drop', bars: 16, energyStart: 1.0, energyEnd: 1.0 },
    { name: 'OUTRO', type: 'outro', bars: 8, energyStart: 0.4, energyEnd: 0.1 },
  ],
  // Fred Again style — shorter, more emotional
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
  // Minimal techno
  [
    { name: 'INTRO', type: 'intro', bars: 8, energyStart: 0.1, energyEnd: 0.35 },
    { name: 'GROOVE', type: 'drop', bars: 16, energyStart: 0.7, energyEnd: 0.8 },
    { name: 'BREAK', type: 'breakdown', bars: 8, energyStart: 0.4, energyEnd: 0.3 },
    { name: 'PEAK', type: 'drop', bars: 16, energyStart: 0.9, energyEnd: 1.0 },
    { name: 'OUTRO', type: 'outro', bars: 8, energyStart: 0.5, energyEnd: 0.1 },
  ],
];

// ── Main Composer ───────────────────────────────────────────────────────

export function composeSong(): GeneratedSong {
  // Pick musical parameters
  const rootIdx = randInt(0, 12);
  const key = KEY_NAMES[rootIdx];
  const scaleEntries = Object.entries(SCALES);
  const [scaleName, scale] = pick(scaleEntries);
  const bpm = randInt(118, 129);
  const progression = pick(CHORD_PROGRESSIONS);
  const structure = pick(SONG_STRUCTURES);
  const title = `${pick(SONG_TITLES_A)} ${pick(SONG_TITLES_B)}`;

  const stepsPerBar = 16;

  const sections: SongSection[] = [];

  for (const def of structure) {
    // Generate patterns for each bar in this section
    const allDrums: StepData[][][] = [];
    const allBass: SongTrackNote[][] = [];
    const allChords: SongChordEvent[][] = [];
    const allLead: SongTrackNote[][] = [];

    for (let bar = 0; bar < def.bars; bar++) {
      const t = def.bars > 1 ? bar / (def.bars - 1) : 0;
      const energy = def.energyStart + (def.energyEnd - def.energyStart) * t;
      const chordIdx = progression[bar % progression.length];

      allDrums.push(generateDrumPattern(energy, def.type, stepsPerBar));
      allBass.push(generateBass(rootIdx, scale, chordIdx, energy, def.type, stepsPerBar));
      allChords.push(generateChords(rootIdx, scale, chordIdx, energy, def.type, stepsPerBar));
      allLead.push(generateMelody(rootIdx, scale, chordIdx, energy, def.type, stepsPerBar));
    }

    // Flatten bars into section-level arrays with step offsets
    const totalSteps = def.bars * stepsPerBar;
    const sectionDrums = emptyPattern(16, totalSteps);
    const sectionBass: SongTrackNote[] = [];
    const sectionChords: SongChordEvent[] = [];
    const sectionLead: SongTrackNote[] = [];

    for (let bar = 0; bar < def.bars; bar++) {
      const offset = bar * stepsPerBar;

      // Merge drum patterns
      for (let pad = 0; pad < 16; pad++) {
        for (let step = 0; step < stepsPerBar; step++) {
          if (allDrums[bar][pad][step].active) {
            sectionDrums[pad][offset + step] = allDrums[bar][pad][step];
          }
        }
      }

      // Offset note events
      for (const n of allBass[bar]) {
        sectionBass.push({ ...n, step: n.step + offset });
      }
      for (const c of allChords[bar]) {
        sectionChords.push({ ...c, step: c.step + offset });
      }
      for (const n of allLead[bar]) {
        sectionLead.push({ ...n, step: n.step + offset });
      }
    }

    const avgEnergy = (def.energyStart + def.energyEnd) / 2;
    sections.push({
      name: def.name,
      bars: def.bars,
      energy: avgEnergy,
      drumPattern: sectionDrums,
      bassNotes: sectionBass,
      chordNotes: sectionChords,
      leadNotes: sectionLead,
    });
  }

  return {
    title,
    key: `${key} ${scaleName}`,
    scaleName,
    bpm,
    sections,
  };
}
