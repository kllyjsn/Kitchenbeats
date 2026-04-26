import { useState, useRef, useCallback, useEffect } from 'react';
import type { SynthPreset, SynthNote } from '../types';
import { SYNTH_PRESETS } from '../types';
import { SynthEngine } from '../engine/SynthEngine';

export interface SynthState {
  preset: SynthPreset;
  presetIndex: number;
  notes: SynthNote[];
  patternLength: number;
  octave: number;
  activeNotes: Set<number>;
  setPreset: (idx: number) => void;
  noteOn: (note: number, velocity?: number) => void;
  noteOff: (note: number) => void;
  addNote: (note: SynthNote) => void;
  removeNote: (startStep: number, noteNum: number) => void;
  clearNotes: () => void;
  setPatternLength: (len: number) => void;
  setOctave: (oct: number) => void;
  getEngine: () => SynthEngine | null;
}

interface UseSynthOptions {
  active?: boolean;
}

const SYNTH_KEY_MAP: Record<string, number> = {
  'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5, 'g': 6,
  'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11, ',': 12,
};

export function useSynth({ active = true }: UseSynthOptions = {}): SynthState {
  const engineRef = useRef<SynthEngine | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const [presetIndex, setPresetIndex] = useState(0);
  const [notes, setNotes] = useState<SynthNote[]>([]);
  const [patternLength, setPatternLength] = useState(16);
  const [octave, setOctave] = useState(3);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  const ensureEngine = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (!engineRef.current) {
      engineRef.current = new SynthEngine(ctxRef.current, ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return engineRef.current;
  }, []);

  const setPreset = useCallback((idx: number) => {
    setPresetIndex(idx);
    const engine = ensureEngine();
    engine.setPreset(SYNTH_PRESETS[idx]);
  }, [ensureEngine]);

  const noteOn = useCallback((note: number, velocity = 0.8) => {
    const engine = ensureEngine();
    engine.noteOn(note, velocity);
    setActiveNotes(prev => new Set(prev).add(note));
  }, [ensureEngine]);

  const noteOff = useCallback((note: number) => {
    const engine = ensureEngine();
    engine.noteOff(note);
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, [ensureEngine]);

  const addNote = useCallback((note: SynthNote) => {
    setNotes(prev => [...prev, note]);
  }, []);

  const removeNote = useCallback((startStep: number, noteNum: number) => {
    setNotes(prev => prev.filter(n => !(n.startStep === startStep && n.note === noteNum)));
  }, []);

  const clearNotes = useCallback(() => setNotes([]), []);

  const getEngine = useCallback(() => engineRef.current, []);

  // Keyboard handler for synth keys — only active in keys mode
  useEffect(() => {
    if (!active) return;

    const pressed = new Set<string>();

    const handleDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement) return;
      const key = e.key.toLowerCase();
      const offset = SYNTH_KEY_MAP[key];
      if (offset !== undefined && !pressed.has(key)) {
        pressed.add(key);
        const midiNote = (octave + 1) * 12 + offset;
        noteOn(midiNote);
      }
    };

    const handleUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const offset = SYNTH_KEY_MAP[key];
      if (offset !== undefined) {
        pressed.delete(key);
        const midiNote = (octave + 1) * 12 + offset;
        noteOff(midiNote);
      }
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      for (const key of pressed) {
        const off = SYNTH_KEY_MAP[key];
        if (off !== undefined) {
          const midiNote = (octave + 1) * 12 + off;
          noteOff(midiNote);
        }
      }
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [active, octave, noteOn, noteOff]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  return {
    preset: SYNTH_PRESETS[presetIndex],
    presetIndex,
    notes,
    patternLength,
    octave,
    activeNotes,
    setPreset,
    noteOn,
    noteOff,
    addNote,
    removeNote,
    clearNotes,
    setPatternLength,
    setOctave,
    getEngine,
  };
}
