import { useState, useRef, useCallback, useEffect } from 'react';
import type { PadBank, PadConfig, Pattern, MasterEffects, ViewMode, StepData } from '../types';
import { DEFAULT_KIT_NAMES, PAD_COLORS } from '../types';
import { AudioEngine } from '../engine/AudioEngine';
import { Sequencer } from '../engine/Sequencer';

function createDefaultPad(id: number): PadConfig {
  const kit = DEFAULT_KIT_NAMES[id] ?? { name: `PAD ${id + 1}`, drum: 'kick' as const };
  return {
    id,
    name: kit.name,
    color: PAD_COLORS[id] ?? '#666',
    volume: 0.8,
    pan: 0,
    pitch: 0,
    filterFreq: 20000,
    filterQ: 1,
    filterType: 'lowpass',
    reverbSend: 0,
    delaySend: 0,
    muted: false,
    soloed: false,
    chokeGroup: 0,
    attack: 0,
    release: 0.1,
    drumType: kit.drum,
  };
}

function createDefaultPattern(id: number): Pattern {
  const steps: StepData[][] = [];
  for (let pad = 0; pad < 16; pad++) {
    const padSteps: StepData[] = [];
    for (let s = 0; s < 32; s++) {
      padSteps.push({ active: false, velocity: 0.8 });
    }
    steps.push(padSteps);
  }
  return { id, name: `Pattern ${id + 1}`, steps, length: 16, swing: 0 };
}

function createDefaultMasterEffects(): MasterEffects {
  return {
    reverbDecay: 2.0,
    reverbMix: 0.15,
    delayTime: 0.375,
    delayFeedback: 0.3,
    delayMix: 0,
    filterFreq: 20000,
    filterQ: 1,
    filterType: 'lowpass',
    compThreshold: -12,
    compRatio: 4,
    masterVolume: 0.85,
    distortion: 0,
  };
}

export function useMPC() {
  const engineRef = useRef<AudioEngine | null>(null);
  const sequencerRef = useRef<Sequencer | null>(null);

  const [bpm, setBpmState] = useState(90);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentBank, setCurrentBank] = useState<PadBank>('A');
  const [currentPatternIdx, setCurrentPatternIdx] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('pads');
  const [selectedPad, setSelectedPad] = useState(0);
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [stepLength, setStepLength] = useState(16);

  const [pads, setPads] = useState<Record<PadBank, PadConfig[]>>(() => ({
    A: Array.from({ length: 16 }, (_, i) => createDefaultPad(i)),
    B: Array.from({ length: 16 }, (_, i) => createDefaultPad(i)),
    C: Array.from({ length: 16 }, (_, i) => createDefaultPad(i)),
    D: Array.from({ length: 16 }, (_, i) => createDefaultPad(i)),
  }));

  const [patterns, setPatterns] = useState<Pattern[]>(() =>
    Array.from({ length: 8 }, (_, i) => createDefaultPattern(i))
  );

  const [masterEffects, setMasterEffects] = useState<MasterEffects>(createDefaultMasterEffects);

  const getEngine = useCallback((): AudioEngine => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
    }
    return engineRef.current;
  }, []);

  const getSequencer = useCallback((): Sequencer => {
    if (!sequencerRef.current) {
      sequencerRef.current = new Sequencer(getEngine());
    }
    return sequencerRef.current;
  }, [getEngine]);

  useEffect(() => {
    const engine = getEngine();
    engine.updateMasterEffects(masterEffects);
  }, [masterEffects, getEngine]);

  useEffect(() => {
    const seq = getSequencer();
    seq.setPattern(patterns[currentPatternIdx]);
    seq.setPads(pads[currentBank]);
  }, [pads, currentBank, patterns, currentPatternIdx, getSequencer]);

  useEffect(() => {
    const seq = getSequencer();
    seq.setCallback((step) => setCurrentStep(step));
  }, [getSequencer]);

  const triggerPad = useCallback((padIndex: number, velocity: number = 0.8) => {
    const engine = getEngine();
    const pad = pads[currentBank][padIndex];
    if (!pad || pad.muted) return;
    engine.triggerPad(pad, velocity);

    setActivePads(prev => {
      const next = new Set(prev);
      next.add(padIndex);
      return next;
    });
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(padIndex);
        return next;
      });
    }, 150);

    if (recording && playing) {
      setPatterns(prev => {
        const next = [...prev];
        const p = { ...next[currentPatternIdx] };
        const steps = p.steps.map(s => [...s]);
        const step = currentStep >= 0 ? currentStep : 0;
        steps[padIndex] = [...steps[padIndex]];
        steps[padIndex][step] = { active: true, velocity };
        p.steps = steps;
        next[currentPatternIdx] = p;
        return next;
      });
    }
  }, [pads, currentBank, getEngine, recording, playing, currentStep, currentPatternIdx]);

  const setBpm = useCallback((v: number) => {
    setBpmState(v);
    getSequencer().setBPM(v);
  }, [getSequencer]);

  const togglePlay = useCallback(() => {
    const seq = getSequencer();
    if (seq.isPlaying()) {
      seq.stop();
      setPlaying(false);
      setCurrentStep(-1);
    } else {
      seq.setBPM(bpm);
      seq.start();
      setPlaying(true);
    }
  }, [bpm, getSequencer]);

  const toggleRecord = useCallback(() => {
    setRecording(r => !r);
  }, []);

  const toggleStep = useCallback((padIndex: number, stepIndex: number) => {
    setPatterns(prev => {
      const next = [...prev];
      const p = { ...next[currentPatternIdx] };
      const steps = p.steps.map(s => [...s]);
      steps[padIndex] = [...steps[padIndex]];
      const was = steps[padIndex][stepIndex].active;
      steps[padIndex][stepIndex] = {
        ...steps[padIndex][stepIndex],
        active: !was,
        velocity: was ? 0 : 0.8,
      };
      p.steps = steps;
      next[currentPatternIdx] = p;
      return next;
    });
  }, [currentPatternIdx]);

  const setStepVelocity = useCallback((padIndex: number, stepIndex: number, velocity: number) => {
    setPatterns(prev => {
      const next = [...prev];
      const p = { ...next[currentPatternIdx] };
      const steps = p.steps.map(s => [...s]);
      steps[padIndex] = [...steps[padIndex]];
      steps[padIndex][stepIndex] = { ...steps[padIndex][stepIndex], velocity };
      p.steps = steps;
      next[currentPatternIdx] = p;
      return next;
    });
  }, [currentPatternIdx]);

  const updatePad = useCallback((padIndex: number, updates: Partial<PadConfig>) => {
    setPads(prev => ({
      ...prev,
      [currentBank]: prev[currentBank].map((p, i) =>
        i === padIndex ? { ...p, ...updates } : p
      ),
    }));
  }, [currentBank]);

  const updateMasterEffect = useCallback((key: keyof MasterEffects, value: number | BiquadFilterType) => {
    setMasterEffects(prev => ({ ...prev, [key]: value }));
  }, []);

  const setSwing = useCallback((swing: number) => {
    setPatterns(prev => {
      const next = [...prev];
      next[currentPatternIdx] = { ...next[currentPatternIdx], swing };
      return next;
    });
  }, [currentPatternIdx]);

  const setPatternLength = useCallback((len: number) => {
    setStepLength(len);
    setPatterns(prev => {
      const next = [...prev];
      const p = { ...next[currentPatternIdx], length: len };
      const steps = p.steps.map(padSteps => {
        const arr = [...padSteps];
        while (arr.length < len) arr.push({ active: false, velocity: 0.8 });
        return arr;
      });
      p.steps = steps;
      next[currentPatternIdx] = p;
      return next;
    });
  }, [currentPatternIdx]);

  const clearPattern = useCallback(() => {
    setPatterns(prev => {
      const next = [...prev];
      const p = { ...next[currentPatternIdx] };
      p.steps = p.steps.map(padSteps => padSteps.map(() => ({ active: false, velocity: 0.8 })));
      next[currentPatternIdx] = p;
      return next;
    });
  }, [currentPatternIdx]);

  const copyPattern = useCallback((from: number, to: number) => {
    setPatterns(prev => {
      const next = [...prev];
      next[to] = {
        ...JSON.parse(JSON.stringify(prev[from])) as Pattern,
        id: to,
        name: `Pattern ${to + 1}`,
      };
      return next;
    });
  }, []);

  const exportWav = useCallback(async () => {
    const engine = getEngine();
    const currentPads = pads[currentBank];
    const buffer = await engine.renderOffline(currentPads, patterns, bpm, [currentPatternIdx]);

    const wavBlob = audioBufferToWav(buffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beat-${bpm}bpm-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getEngine, pads, currentBank, patterns, bpm, currentPatternIdx]);

  return {
    bpm, setBpm,
    playing, togglePlay,
    recording, toggleRecord,
    currentStep,
    currentBank, setCurrentBank,
    currentPatternIdx, setCurrentPatternIdx,
    viewMode, setViewMode,
    selectedPad, setSelectedPad,
    activePads,
    pads: pads[currentBank],
    allPads: pads,
    patterns,
    currentPattern: patterns[currentPatternIdx],
    masterEffects,
    stepLength,
    triggerPad,
    toggleStep,
    setStepVelocity,
    updatePad,
    updateMasterEffect,
    setSwing,
    setPatternLength,
    clearPattern,
    copyPattern,
    exportWav,
    setMasterEffects,
    getEngine,
  };
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, headerSize + dataSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
