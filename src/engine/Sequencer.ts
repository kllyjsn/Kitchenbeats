import type { PadConfig, Pattern } from '../types';
import type { AudioEngine } from './AudioEngine';

export type SequencerCallback = (step: number) => void;

export class Sequencer {
  private engine: AudioEngine;
  private bpm: number = 122;
  private playing: boolean = false;
  private currentStep: number = -1;
  private nextStepTime: number = 0;
  private timerId: number = 0;
  private pattern: Pattern | null = null;
  private pads: PadConfig[] = [];
  private onStep: SequencerCallback | null = null;
  private lookahead: number = 25;
  private scheduleAhead: number = 0.1;

  constructor(engine: AudioEngine) {
    this.engine = engine;
  }

  setCallback(cb: SequencerCallback): void {
    this.onStep = cb;
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(30, Math.min(300, bpm));
  }

  setPattern(pattern: Pattern): void {
    this.pattern = pattern;
  }

  setPads(pads: PadConfig[]): void {
    this.pads = pads;
  }

  start(): void {
    if (this.playing) return;
    this.engine.ensureRunning();
    this.playing = true;
    this.currentStep = -1;
    this.nextStepTime = this.engine.ctx.currentTime;
    this.scheduler();
  }

  stop(): void {
    this.playing = false;
    this.currentStep = -1;
    clearTimeout(this.timerId);
    this.onStep?.(-1);
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  private scheduler(): void {
    if (!this.playing || !this.pattern) return;

    while (this.nextStepTime < this.engine.ctx.currentTime + this.scheduleAhead) {
      this.currentStep = (this.currentStep + 1) % this.pattern.length;
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceTime();
    }

    this.timerId = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private advanceTime(): void {
    if (!this.pattern) return;
    const stepDuration = 60 / this.bpm / 4;
    let swing = 0;
    if (this.currentStep % 2 === 0) {
      swing = (this.pattern.swing / 100) * stepDuration * 0.5;
    }
    this.nextStepTime += stepDuration + swing;
  }

  private scheduleStep(step: number, time: number): void {
    if (!this.pattern) return;

    const hasSolo = this.pads.some(p => p.soloed);

    for (let padIdx = 0; padIdx < this.pads.length; padIdx++) {
      const stepData = this.pattern.steps[padIdx]?.[step];
      if (!stepData?.active) continue;

      const pad = this.pads[padIdx];
      if (pad.muted) continue;
      if (hasSolo && !pad.soloed) continue;

      this.engine.triggerPadAt(pad, stepData.velocity, time);
    }

    const scheduleDelay = Math.max(0, (time - this.engine.ctx.currentTime) * 1000);
    setTimeout(() => this.onStep?.(step), scheduleDelay);
  }
}
