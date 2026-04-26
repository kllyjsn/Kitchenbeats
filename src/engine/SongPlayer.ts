import type { GeneratedSong, SongSection } from '../types';
import { SYNTH_PRESETS } from '../types';
import { DrumSynth } from './DrumSynth';
import { SynthEngine } from './SynthEngine';
import { VocalSynth } from './VocalSynth';

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
  private arpSynth: SynthEngine;
  private vocalSynth: VocalSynth;
  private riserOsc: OscillatorNode | null = null;
  private riserGain: GainNode | null = null;
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

    // Bass track
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.7, ctx.currentTime);
    bassGain.connect(this.masterGain);
    this.bassSynth = new SynthEngine(ctx, bassGain);
    this.bassSynth.setPreset(SYNTH_PRESETS[0]); // DEEP BASS

    // Chord track
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.3, ctx.currentTime);
    chordGain.connect(this.masterGain);
    this.chordSynth = new SynthEngine(ctx, chordGain);
    this.chordSynth.setPreset(SYNTH_PRESETS[3]); // WARM PAD

    // Lead track
    const leadGain = ctx.createGain();
    leadGain.gain.setValueAtTime(0.35, ctx.currentTime);
    leadGain.connect(this.masterGain);
    this.leadSynth = new SynthEngine(ctx, leadGain);
    this.leadSynth.setPreset(SYNTH_PRESETS[4]); // PLUCK

    // Arp track
    const arpGain = ctx.createGain();
    arpGain.gain.setValueAtTime(0.25, ctx.currentTime);
    arpGain.connect(this.masterGain);
    this.arpSynth = new SynthEngine(ctx, arpGain);
    this.arpSynth.setPreset(SYNTH_PRESETS[4]); // PLUCK (higher register)

    // Vocal track
    const vocalGain = ctx.createGain();
    vocalGain.gain.setValueAtTime(0.4, ctx.currentTime);
    vocalGain.connect(this.masterGain);
    this.vocalSynth = new VocalSynth(ctx, vocalGain);
  }

  get playing(): boolean { return this._playing; }

  setSong(song: GeneratedSong): void {
    this.stop();
    this.song = song;

    // Set presets based on genre
    const genre = song.genre;
    if (genre === 'acid_techno' || genre === 'minimal_techno') {
      this.bassSynth.setPreset(SYNTH_PRESETS[2]); // ACID LEAD for bass
      this.arpSynth.setPreset(SYNTH_PRESETS[2]);  // ACID LEAD
    } else if (genre === 'lo_fi_hip_hop') {
      this.bassSynth.setPreset(SYNTH_PRESETS[0]); // DEEP BASS
      this.chordSynth.setPreset(SYNTH_PRESETS[7]); // ORGAN
      this.leadSynth.setPreset(SYNTH_PRESETS[4]);  // PLUCK
    } else if (genre === 'ambient') {
      this.chordSynth.setPreset(SYNTH_PRESETS[3]); // WARM PAD
      this.leadSynth.setPreset(SYNTH_PRESETS[4]);   // PLUCK
      this.arpSynth.setPreset(SYNTH_PRESETS[3]);    // WARM PAD
    } else if (genre === 'uk_garage') {
      this.bassSynth.setPreset(SYNTH_PRESETS[1]); // SUB BASS
      this.chordSynth.setPreset(SYNTH_PRESETS[6]); // STAB
    } else {
      this.bassSynth.setPreset(SYNTH_PRESETS[0]);
      this.chordSynth.setPreset(SYNTH_PRESETS[3]);
      this.leadSynth.setPreset(SYNTH_PRESETS[4]);
      this.arpSynth.setPreset(SYNTH_PRESETS[4]);
    }
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
    this.arpSynth.panic();
    this.vocalSynth.panic();
    this.stopRiser();
    this.emitUpdate();
  }

  pause(): void {
    this._playing = false;
    clearTimeout(this.timerId);
    this.bassSynth.panic();
    this.chordSynth.panic();
    this.leadSynth.panic();
    this.arpSynth.panic();
    this.vocalSynth.panic();
    this.stopRiser();
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

    // Arpeggiator
    for (const note of section.arpNotes) {
      if (note.step === step) {
        this.scheduleNote(this.arpSynth, note.note, note.velocity, note.duration, time);
      }
    }

    // Vocals
    for (const vocal of section.vocalEvents) {
      if (vocal.step === step) {
        this.scheduleVocal(vocal.note, vocal.velocity, vocal.duration, vocal.vowel, vocal.style, time);
      }
    }

    // FX Riser
    if (section.fxRiser && step === 0 && !this.riserOsc) {
      this.startRiser(section.bars * 16 * this.stepDuration);
    }
  }

  private scheduleNote(synth: SynthEngine, note: number, velocity: number, durationSteps: number, time: number): void {
    const delay = Math.max(0, time - this.ctx.currentTime);
    setTimeout(() => synth.noteOn(note, velocity), delay * 1000);
    setTimeout(() => synth.noteOff(note), (delay + durationSteps * this.stepDuration) * 1000);
  }

  private scheduleVocal(
    note: number, velocity: number, durationSteps: number,
    vowel: 'a' | 'e' | 'i' | 'o' | 'u', style: 'chop' | 'stab' | 'pad' | 'choir' | 'whisper',
    time: number
  ): void {
    const delay = Math.max(0, time - this.ctx.currentTime);
    setTimeout(() => this.vocalSynth.noteOn(note, velocity, vowel, style), delay * 1000);
    if (style === 'pad' || style === 'choir' || style === 'whisper') {
      setTimeout(() => this.vocalSynth.noteOff(note), (delay + durationSteps * this.stepDuration) * 1000);
    }
  }

  private startRiser(duration: number): void {
    this.stopRiser();
    this.riserGain = this.ctx.createGain();
    this.riserGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.riserGain.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + duration * 0.9);
    this.riserGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    this.riserGain.connect(this.masterGain);

    this.riserOsc = this.ctx.createOscillator();
    this.riserOsc.type = 'sawtooth';
    this.riserOsc.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.riserOsc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, this.ctx.currentTime + duration);
    filter.Q.setValueAtTime(5, this.ctx.currentTime);

    this.riserOsc.connect(filter);
    filter.connect(this.riserGain);
    this.riserOsc.start();

    setTimeout(() => this.stopRiser(), duration * 1000);
  }

  private stopRiser(): void {
    if (this.riserOsc) {
      try { this.riserOsc.stop(); } catch { /* */ }
      this.riserOsc.disconnect();
      this.riserOsc = null;
    }
    if (this.riserGain) {
      this.riserGain.disconnect();
      this.riserGain = null;
    }
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
      this.stopRiser();
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
    this.arpSynth.destroy();
    this.vocalSynth.destroy();
    this.masterGain.disconnect();
  }
}
