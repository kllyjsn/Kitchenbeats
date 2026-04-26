import type { GeneratedSong, SongSection } from '../types';
import { SYNTH_PRESETS } from '../types';
import { DrumSynth } from './DrumSynth';
import { SynthEngine } from './SynthEngine';

const DRUM_TYPES = [
  'kick', 'snare', 'clap', 'closedHat', 'openHat',
  'rimshot', 'lowTom', 'highTom', 'cowbell', 'crash',
  'ride', 'shaker', 'conga', 'claves', 'clave2', 'midTom',
] as const;

export type SongPlayerCallback = (info: {
  sectionIndex: number;
  sectionStep: number;
  totalStep: number;
  sectionName: string;
  playing: boolean;
}) => void;

export class SongPlayer {
  private ctx: AudioContext;
  private drumSynth: DrumSynth;
  private bassSynth: SynthEngine;
  private chordSynth: SynthEngine;
  private leadSynth: SynthEngine;
  private masterGain: GainNode;

  private song: GeneratedSong | null = null;
  private _playing = false;
  private timerId: number = 0;
  private nextStepTime = 0;
  private currentSectionIdx = 0;
  private currentStepInSection = 0;
  private totalStepCount = 0;
  private callback: SongPlayerCallback | null = null;

  private readonly LOOKAHEAD = 0.025;
  private readonly SCHEDULE_AHEAD = 0.1;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    this.drumSynth = new DrumSynth(ctx);

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.7, ctx.currentTime);
    bassGain.connect(this.masterGain);

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.3, ctx.currentTime);
    chordGain.connect(this.masterGain);

    const leadGain = ctx.createGain();
    leadGain.gain.setValueAtTime(0.35, ctx.currentTime);
    leadGain.connect(this.masterGain);

    this.bassSynth = new SynthEngine(ctx, bassGain);
    this.bassSynth.setPreset(SYNTH_PRESETS[0]); // DEEP BASS

    this.chordSynth = new SynthEngine(ctx, chordGain);
    this.chordSynth.setPreset(SYNTH_PRESETS[3]); // WARM PAD

    this.leadSynth = new SynthEngine(ctx, leadGain);
    this.leadSynth.setPreset(SYNTH_PRESETS[4]); // PLUCK
  }

  get playing(): boolean { return this._playing; }

  setSong(song: GeneratedSong): void {
    this.stop();
    this.song = song;
  }

  onUpdate(cb: SongPlayerCallback): void {
    this.callback = cb;
  }

  play(): void {
    if (!this.song || this._playing) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._playing = true;
    this.nextStepTime = this.ctx.currentTime;
    this.schedule();
  }

  stop(): void {
    this._playing = false;
    clearTimeout(this.timerId);
    this.currentSectionIdx = 0;
    this.currentStepInSection = 0;
    this.totalStepCount = 0;
    this.bassSynth.panic();
    this.chordSynth.panic();
    this.leadSynth.panic();
    this.emitUpdate();
  }

  pause(): void {
    this._playing = false;
    clearTimeout(this.timerId);
    this.bassSynth.panic();
    this.chordSynth.panic();
    this.leadSynth.panic();
    this.emitUpdate();
  }

  private get currentSection(): SongSection | null {
    if (!this.song) return null;
    return this.song.sections[this.currentSectionIdx] ?? null;
  }

  private get stepDuration(): number {
    if (!this.song) return 0.125;
    return 60 / this.song.bpm / 4;
  }

  getTotalSteps(): number {
    if (!this.song) return 0;
    return this.song.sections.reduce((sum, s) => sum + s.bars * 16, 0);
  }

  getCurrentInfo() {
    return {
      sectionIndex: this.currentSectionIdx,
      sectionStep: this.currentStepInSection,
      totalStep: this.totalStepCount,
      sectionName: this.currentSection?.name ?? '',
      playing: this._playing,
    };
  }

  private schedule(): void {
    if (!this._playing || !this.song) return;

    while (this.nextStepTime < this.ctx.currentTime + this.SCHEDULE_AHEAD) {
      this.playStep(this.nextStepTime);
      this.nextStepTime += this.stepDuration;
      this.advance();
    }

    this.timerId = window.setTimeout(() => this.schedule(), this.LOOKAHEAD * 1000);
  }

  private playStep(time: number): void {
    const section = this.currentSection;
    if (!section) return;
    const step = this.currentStepInSection;

    // Drums
    for (let pad = 0; pad < 16 && pad < section.drumPattern.length; pad++) {
      if (step < section.drumPattern[pad].length && section.drumPattern[pad][step].active) {
        const vel = section.drumPattern[pad][step].velocity;
        this.drumSynth.triggerAt(DRUM_TYPES[pad], this.masterGain, vel, time);
      }
    }

    // Bass
    for (const note of section.bassNotes) {
      if (note.step === step) {
        this.scheduleNote(this.bassSynth, note.note, note.velocity, note.duration, time);
      }
    }

    // Chords
    for (const chord of section.chordNotes) {
      if (chord.step === step) {
        for (const n of chord.notes) {
          this.scheduleNote(this.chordSynth, n, chord.velocity, chord.duration, time);
        }
      }
    }

    // Lead melody
    for (const note of section.leadNotes) {
      if (note.step === step) {
        this.scheduleNote(this.leadSynth, note.note, note.velocity, note.duration, time);
      }
    }
  }

  private scheduleNote(synth: SynthEngine, note: number, velocity: number, durationSteps: number, time: number): void {
    const delay = Math.max(0, time - this.ctx.currentTime);
    setTimeout(() => synth.noteOn(note, velocity), delay * 1000);
    setTimeout(() => synth.noteOff(note), (delay + durationSteps * this.stepDuration) * 1000);
  }

  private advance(): void {
    if (!this.song) return;
    const section = this.currentSection;
    if (!section) { this.stop(); return; }

    this.currentStepInSection++;
    this.totalStepCount++;

    const sectionSteps = section.bars * 16;
    if (this.currentStepInSection >= sectionSteps) {
      this.currentStepInSection = 0;
      this.currentSectionIdx++;
      if (this.currentSectionIdx >= this.song.sections.length) {
        this.stop();
        return;
      }
    }

    this.emitUpdate();
  }

  private emitUpdate(): void {
    if (this.callback) {
      this.callback(this.getCurrentInfo());
    }
  }

  destroy(): void {
    this.stop();
    this.bassSynth.destroy();
    this.chordSynth.destroy();
    this.leadSynth.destroy();
    this.masterGain.disconnect();
  }
}
