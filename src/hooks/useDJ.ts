import { useState, useRef, useCallback, useEffect } from 'react';
import type { DeckState } from '../types';
import { INITIAL_DECK_STATE } from '../types';
import { DJDeck } from '../engine/DJDeck';

export interface DJState {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;
  loadTrack: (deck: 'A' | 'B', file: File) => Promise<void>;
  play: (deck: 'A' | 'B') => void;
  pause: (deck: 'A' | 'B') => void;
  stop: (deck: 'A' | 'B') => void;
  seek: (deck: 'A' | 'B', time: number) => void;
  setVolume: (deck: 'A' | 'B', vol: number) => void;
  setSpeed: (deck: 'A' | 'B', speed: number) => void;
  setEQ: (deck: 'A' | 'B', band: 'low' | 'mid' | 'high', gain: number) => void;
  setFilter: (deck: 'A' | 'B', freq: number) => void;
  setCrossfader: (value: number) => void;
  setHotCue: (deck: 'A' | 'B', idx: number) => void;
  jumpToHotCue: (deck: 'A' | 'B', idx: number) => void;
  toggleLoop: (deck: 'A' | 'B', bars: number) => void;
  sync: (deck: 'A' | 'B') => void;
  getAnalyser: (deck: 'A' | 'B') => AnalyserNode | null;
}

export function useDJ(): DJState {
  const ctxRef = useRef<AudioContext | null>(null);
  const deckARef = useRef<DJDeck | null>(null);
  const deckBRef = useRef<DJDeck | null>(null);
  const crossGainA = useRef<GainNode | null>(null);
  const crossGainB = useRef<GainNode | null>(null);
  const animRef = useRef<number>(0);

  const [deckAState, setDeckAState] = useState<DeckState>(INITIAL_DECK_STATE);
  const [deckBState, setDeckBState] = useState<DeckState>(INITIAL_DECK_STATE);
  const [crossfader, setCrossfaderState] = useState(0.5);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      crossGainA.current = ctxRef.current.createGain();
      crossGainB.current = ctxRef.current.createGain();
      crossGainA.current.connect(ctxRef.current.destination);
      crossGainB.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const getDeck = useCallback((d: 'A' | 'B'): DJDeck => {
    const ctx = ensureCtx();
    if (d === 'A') {
      if (!deckARef.current) deckARef.current = new DJDeck(ctx, crossGainA.current!);
      return deckARef.current;
    } else {
      if (!deckBRef.current) deckBRef.current = new DJDeck(ctx, crossGainB.current!);
      return deckBRef.current;
    }
  }, [ensureCtx]);

  const syncState = useCallback((d: 'A' | 'B') => {
    const deck = d === 'A' ? deckARef.current : deckBRef.current;
    if (!deck) return;
    (d === 'A' ? setDeckAState : setDeckBState)(prev => ({
      ...prev,
      loaded: deck.loaded,
      fileName: deck.fileName,
      playing: deck.playing,
      bpm: deck.detectedBPM,
      position: deck.position,
      duration: deck.duration,
      waveformData: deck.waveformData,
    }));
  }, []);

  // Animation loop for position updates
  useEffect(() => {
    const tick = () => {
      if (deckARef.current?.playing) {
        setDeckAState(prev => ({ ...prev, position: deckARef.current!.position }));
      }
      if (deckBRef.current?.playing) {
        setDeckBState(prev => ({ ...prev, position: deckBRef.current!.position }));
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const loadTrack = useCallback(async (d: 'A' | 'B', file: File) => {
    const deck = getDeck(d);
    await deck.loadFile(file);
    syncState(d);
  }, [getDeck, syncState]);

  const play = useCallback((d: 'A' | 'B') => {
    getDeck(d).play();
    syncState(d);
  }, [getDeck, syncState]);

  const pause = useCallback((d: 'A' | 'B') => {
    getDeck(d).pause();
    syncState(d);
  }, [getDeck, syncState]);

  const stop = useCallback((d: 'A' | 'B') => {
    getDeck(d).stop();
    syncState(d);
  }, [getDeck, syncState]);

  const seek = useCallback((d: 'A' | 'B', time: number) => {
    getDeck(d).seekTo(time);
    syncState(d);
  }, [getDeck, syncState]);

  const setVolume = useCallback((d: 'A' | 'B', vol: number) => {
    getDeck(d).setVolume(vol);
    (d === 'A' ? setDeckAState : setDeckBState)(prev => ({ ...prev, volume: vol }));
  }, [getDeck]);

  const setSpeed = useCallback((d: 'A' | 'B', speed: number) => {
    getDeck(d).setSpeed(speed);
    (d === 'A' ? setDeckAState : setDeckBState)(prev => ({ ...prev, speed }));
  }, [getDeck]);

  const setEQ = useCallback((d: 'A' | 'B', band: 'low' | 'mid' | 'high', gain: number) => {
    getDeck(d).setEQ(band, gain);
    const key = band === 'low' ? 'eqLow' : band === 'mid' ? 'eqMid' : 'eqHigh';
    (d === 'A' ? setDeckAState : setDeckBState)(prev => ({ ...prev, [key]: gain }));
  }, [getDeck]);

  const setFilter = useCallback((d: 'A' | 'B', freq: number) => {
    getDeck(d).setFilter(freq);
    (d === 'A' ? setDeckAState : setDeckBState)(prev => ({ ...prev, filterFreq: freq }));
  }, [getDeck]);

  const setCrossfader = useCallback((value: number) => {
    setCrossfaderState(value);
    const v = Math.max(0, Math.min(1, value));
    // Equal power crossfade
    const aGain = Math.cos(v * Math.PI / 2);
    const bGain = Math.sin(v * Math.PI / 2);
    if (crossGainA.current) crossGainA.current.gain.setValueAtTime(aGain, ctxRef.current?.currentTime ?? 0);
    if (crossGainB.current) crossGainB.current.gain.setValueAtTime(bGain, ctxRef.current?.currentTime ?? 0);
  }, []);

  const setHotCue = useCallback((d: 'A' | 'B', idx: number) => {
    const deck = getDeck(d);
    const pos = deck.position;
    (d === 'A' ? setDeckAState : setDeckBState)(prev => {
      const cues = [...prev.hotCues];
      cues[idx] = pos;
      return { ...prev, hotCues: cues };
    });
  }, [getDeck]);

  const jumpToHotCue = useCallback((d: 'A' | 'B', idx: number) => {
    const state = d === 'A' ? deckAState : deckBState;
    const cue = state.hotCues[idx];
    if (cue !== null) {
      getDeck(d).seekTo(cue);
      syncState(d);
    }
  }, [getDeck, syncState, deckAState, deckBState]);

  const toggleLoop = useCallback((d: 'A' | 'B', bars: number) => {
    const deck = getDeck(d);
    const setState = d === 'A' ? setDeckAState : setDeckBState;
    setState(prev => {
      if (prev.looping) {
        deck.setLoop(false);
        return { ...prev, looping: false };
      }
      const bpm = prev.bpm || 120;
      const beatLen = 60 / bpm;
      const loopLen = beatLen * bars * 4;
      const start = deck.position;
      const end = start + loopLen;
      deck.setLoop(true, start, end);
      return { ...prev, looping: true, loopStart: start, loopEnd: end };
    });
  }, [getDeck]);

  const sync = useCallback((d: 'A' | 'B') => {
    const other = d === 'A' ? deckBRef.current : deckARef.current;
    if (!other) return;
    const targetBPM = other.detectedBPM;
    if (targetBPM === 0) return;
    const deck = getDeck(d);
    const deckBPM = deck.detectedBPM;
    if (deckBPM === 0) return;
    const ratio = targetBPM / deckBPM;
    deck.setSpeed(ratio);
    (d === 'A' ? setDeckAState : setDeckBState)(prev => ({ ...prev, speed: ratio }));
  }, [getDeck]);

  const getAnalyser = useCallback((d: 'A' | 'B'): AnalyserNode | null => {
    const deck = d === 'A' ? deckARef.current : deckBRef.current;
    return deck?.getAnalyser() ?? null;
  }, []);

  useEffect(() => {
    return () => {
      deckARef.current?.destroy();
      deckBRef.current?.destroy();
    };
  }, []);

  return {
    deckA: deckAState,
    deckB: deckBState,
    crossfader,
    loadTrack, play, pause, stop, seek,
    setVolume, setSpeed, setEQ, setFilter,
    setCrossfader, setHotCue, jumpToHotCue,
    toggleLoop, sync, getAnalyser,
  };
}
