import type { SynthPreset, OscWaveform } from '../types';
import { noteToFreq, SYNTH_PRESETS } from '../types';

interface Voice {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc1Gain: GainNode;
  osc2Gain: GainNode;
  filter: BiquadFilterNode;
  vca: GainNode;
  note: number;
  startTime: number;
  released: boolean;
}

function mapWaveform(w: OscWaveform): OscillatorType {
  return w === 'saw' ? 'sawtooth' : w;
}

export class SynthEngine {
  private ctx: AudioContext;
  private output: GainNode;
  private voices: Map<number, Voice> = new Map();
  private preset: SynthPreset;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private maxPolyphony = 8;
  private lastFreq = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.setValueAtTime(0.5, ctx.currentTime);
    this.output.connect(destination);
    this.preset = SYNTH_PRESETS[0];
  }

  setPreset(preset: SynthPreset): void {
    this.preset = preset;
    this.updateLFO();
  }

  getPreset(): SynthPreset { return this.preset; }

  getOutput(): GainNode { return this.output; }

  private updateLFO(): void {
    if (this.lfo) { this.lfo.stop(); this.lfo.disconnect(); }
    if (this.lfoGain) { this.lfoGain.disconnect(); }

    if (this.preset.lfoRate > 0 && this.preset.lfoDepth > 0) {
      this.lfo = this.ctx.createOscillator();
      this.lfoGain = this.ctx.createGain();
      this.lfo.type = 'sine';
      this.lfo.frequency.setValueAtTime(this.preset.lfoRate, this.ctx.currentTime);
      this.lfoGain.gain.setValueAtTime(this.preset.lfoDepth, this.ctx.currentTime);
      this.lfo.connect(this.lfoGain);
      this.lfo.start();
    }
  }

  noteOn(note: number, velocity: number = 0.8): void {
    if (this.voices.has(note)) this.noteOff(note);

    if (this.voices.size >= this.maxPolyphony) {
      let oldest: Voice | null = null;
      let oldestNote = -1;
      for (const [n, v] of this.voices) {
        if (!oldest || v.startTime < oldest.startTime) {
          oldest = v; oldestNote = n;
        }
      }
      if (oldestNote >= 0) this.killVoice(oldestNote);
    }

    const t = this.ctx.currentTime;
    const p = this.preset;
    const freq = noteToFreq(note);
    const vel = Math.max(0, Math.min(1, velocity));

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(p.filterCutoff, t);
    filter.Q.setValueAtTime(p.filterResonance, t);

    // Filter envelope
    const fEnv = p.filterEnvelope;
    const fPeak = Math.min(20000, p.filterCutoff + p.filterEnvAmount * vel);
    filter.frequency.setValueAtTime(p.filterCutoff, t);
    filter.frequency.linearRampToValueAtTime(fPeak, t + fEnv.attack);
    filter.frequency.setTargetAtTime(
      p.filterCutoff + (fPeak - p.filterCutoff) * fEnv.sustain,
      t + fEnv.attack,
      Math.max(0.001, fEnv.decay / 3)
    );

    const vca = this.ctx.createGain();
    const aEnv = p.ampEnvelope;
    vca.gain.setValueAtTime(0, t);
    vca.gain.linearRampToValueAtTime(vel * 0.4, t + aEnv.attack);
    vca.gain.setTargetAtTime(vel * 0.4 * aEnv.sustain, t + aEnv.attack, Math.max(0.001, aEnv.decay / 3));

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc1Gain = this.ctx.createGain();
    const osc2Gain = this.ctx.createGain();

    osc1.type = mapWaveform(p.osc1Wave);
    osc2.type = mapWaveform(p.osc2Wave);

    const targetFreq1 = freq;
    const targetFreq2 = freq * Math.pow(2, p.osc2Octave);

    if (p.glide > 0 && this.lastFreq > 0) {
      osc1.frequency.setValueAtTime(this.lastFreq, t);
      osc1.frequency.exponentialRampToValueAtTime(targetFreq1, t + p.glide);
      osc2.frequency.setValueAtTime(this.lastFreq * Math.pow(2, p.osc2Octave), t);
      osc2.frequency.exponentialRampToValueAtTime(targetFreq2, t + p.glide);
    } else {
      osc1.frequency.setValueAtTime(targetFreq1, t);
      osc2.frequency.setValueAtTime(targetFreq2, t);
    }

    osc2.detune.setValueAtTime(p.osc2Detune, t);
    osc1Gain.gain.setValueAtTime(p.osc1Gain, t);
    osc2Gain.gain.setValueAtTime(p.osc2Gain, t);

    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    osc1Gain.connect(filter);
    osc2Gain.connect(filter);
    filter.connect(vca);
    vca.connect(this.output);

    // LFO routing
    if (this.lfoGain) {
      if (p.lfoTarget === 'filter') {
        this.lfoGain.connect(filter.frequency);
      } else if (p.lfoTarget === 'pitch') {
        this.lfoGain.connect(osc1.frequency);
        this.lfoGain.connect(osc2.frequency);
      } else {
        this.lfoGain.connect(vca.gain);
      }
    }

    osc1.start(t);
    osc2.start(t);
    this.lastFreq = freq;

    this.voices.set(note, {
      osc1, osc2, osc1Gain, osc2Gain, filter, vca,
      note, startTime: t, released: false,
    });
  }

  noteOff(note: number): void {
    const voice = this.voices.get(note);
    if (!voice || voice.released) return;

    const t = this.ctx.currentTime;
    const p = this.preset;
    voice.released = true;

    voice.vca.gain.cancelScheduledValues(t);
    voice.vca.gain.setValueAtTime(voice.vca.gain.value, t);
    voice.vca.gain.setTargetAtTime(0, t, Math.max(0.001, p.ampEnvelope.release / 3));

    voice.filter.frequency.cancelScheduledValues(t);
    voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, t);
    voice.filter.frequency.setTargetAtTime(p.filterCutoff, t, Math.max(0.001, p.filterEnvelope.release / 3));

    const stopTime = t + p.ampEnvelope.release + 0.1;
    voice.osc1.stop(stopTime);
    voice.osc2.stop(stopTime);

    setTimeout(() => {
      if (this.voices.get(note) === voice) {
        this.voices.delete(note);
      }
    }, (p.ampEnvelope.release + 0.2) * 1000);
  }

  private killVoice(note: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;
    try {
      voice.osc1.stop();
      voice.osc2.stop();
    } catch {
      // already stopped
    }
    voice.osc1.disconnect();
    voice.osc2.disconnect();
    voice.vca.disconnect();
    voice.filter.disconnect();
    this.voices.delete(note);
  }

  panic(): void {
    for (const note of [...this.voices.keys()]) {
      this.killVoice(note);
    }
  }

  destroy(): void {
    this.panic();
    if (this.lfo) { this.lfo.stop(); this.lfo.disconnect(); }
    this.output.disconnect();
  }
}
