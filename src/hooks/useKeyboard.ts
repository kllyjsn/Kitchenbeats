import { useEffect, useCallback, useRef } from 'react';
import { KEYBOARD_MAP } from '../types';

interface UseKeyboardProps {
  onTriggerPad: (index: number, velocity: number) => void;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
}

export function useKeyboard({ onTriggerPad, onTogglePlay, onToggleRecord }: UseKeyboardProps) {
  const heldKeys = useRef(new Set<string>());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

    const key = e.key.toLowerCase();

    if (key in KEYBOARD_MAP) {
      e.preventDefault();
      heldKeys.current.add(key);
      onTriggerPad(KEYBOARD_MAP[key], 0.8);
      return;
    }

    if (key === ' ') {
      e.preventDefault();
      onTogglePlay();
      return;
    }

    if (key === 'enter') {
      e.preventDefault();
      onToggleRecord();
    }
  }, [onTriggerPad, onTogglePlay, onToggleRecord]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    heldKeys.current.delete(key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
