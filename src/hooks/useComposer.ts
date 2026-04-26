import { useState, useRef, useCallback, useEffect } from 'react';
import type { GeneratedSong } from '../types';
import { composeSong } from '../engine/Composer';
import { SongPlayer } from '../engine/SongPlayer';

export interface ComposerState {
  song: GeneratedSong | null;
  playing: boolean;
  sectionIndex: number;
  sectionStep: number;
  totalStep: number;
  totalSteps: number;
  sectionName: string;
  generating: boolean;
  generate: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export function useComposer(): ComposerState {
  const ctxRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<SongPlayer | null>(null);

  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [playing, setPlaying] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sectionStep, setSectionStep] = useState(0);
  const [totalStep, setTotalStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [sectionName, setSectionName] = useState('');
  const [generating, setGenerating] = useState(false);

  const ensurePlayer = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (!playerRef.current) {
      playerRef.current = new SongPlayer(ctxRef.current);
      playerRef.current.onUpdate(info => {
        setPlaying(info.playing);
        setSectionIndex(info.sectionIndex);
        setSectionStep(info.sectionStep);
        setTotalStep(info.totalStep);
        setSectionName(info.sectionName);
      });
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return playerRef.current;
  }, []);

  const generate = useCallback(() => {
    setGenerating(true);
    const player = ensurePlayer();
    player.stop();

    // Use setTimeout to allow UI to show "generating" state
    setTimeout(() => {
      const newSong = composeSong();
      setSong(newSong);
      player.setSong(newSong);
      setTotalSteps(player.getTotalSteps());
      setSectionIndex(0);
      setSectionStep(0);
      setTotalStep(0);
      setSectionName('');
      setPlaying(false);
      setGenerating(false);
    }, 50);
  }, [ensurePlayer]);

  const play = useCallback(() => {
    const player = ensurePlayer();
    player.play();
    setPlaying(true);
  }, [ensurePlayer]);

  const pause = useCallback(() => {
    const player = ensurePlayer();
    player.pause();
    setPlaying(false);
  }, [ensurePlayer]);

  const stop = useCallback(() => {
    const player = ensurePlayer();
    player.stop();
    setPlaying(false);
    setSectionIndex(0);
    setSectionStep(0);
    setTotalStep(0);
  }, [ensurePlayer]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  return {
    song, playing, sectionIndex, sectionStep,
    totalStep, totalSteps, sectionName, generating,
    generate, play, pause, stop,
  };
}
