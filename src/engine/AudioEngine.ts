import type { PadConfig, MasterEffects } from '../types';
import { DrumSynth } from './DrumSynth';

export class AudioEngine {
  ctx: AudioContext;
  private masterGain: GainNode;
  private masterCompressor: DynamicsCompressorNode;
  private masterFilter: BiquadFilterNode;
  private reverbNode: ConvolverNode;
  private reverbGain: GainNode;
  private reverbDry: GainNode;
  private delayNode: DelayNode;
  private delayFeedback: GainNode;
  private delayGain: GainNode;
  private delayDry: GainNode;
  analyser: AnalyserNode;
  private padChannels: Map<number, PadChannel> = new Map();
  drumSynth: DrumSynth;

  constructor() {
    this.ctx = new AudioContext();
    this.drumSynth = new DrumSynth(this.ctx);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain = this.ctx.createGain();
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 20000;

    this.reverbNode = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbDry = this.ctx.createGain();
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayFeedback = this.ctx.createGain();
    this.delayGain = this.ctx.createGain();
    this.delayDry = this.ctx.createGain();

    this.reverbGain.gain.value = 0;
    this.reverbDry.gain.value = 1;
    this.delayGain.gain.value = 0;
    this.delayDry.gain.value = 1;
    this.delayFeedback.gain.value = 0.3;
    this.delayNode.delayTime.value = 0.375;

    this.buildReverbIR(2.0);

    // Signal chain: filter → compressor → [dry + reverb + delay] → master → analyser → output
    this.masterFilter.connect(this.masterCompressor);

    // Dry path
    this.masterCompressor.connect(this.reverbDry);
    this.reverbDry.connect(this.masterGain);

    // Reverb send
    this.masterCompressor.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    // Delay send
    this.masterCompressor.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.masterGain);
    this.masterCompressor.connect(this.delayDry);
    this.delayDry.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  private buildReverbIR(decay: number): void {
    const rate = this.ctx.sampleRate;
    const length = Math.ceil(rate * decay);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    this.reverbNode.buffer = buffer;
  }

  ensureRunning(): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getPadChannel(padId: number): PadChannel {
    let ch = this.padChannels.get(padId);
    if (!ch) {
      ch = new PadChannel(this.ctx, this.masterFilter);
      this.padChannels.set(padId, ch);
    }
    return ch;
  }

  triggerPad(pad: PadConfig, velocity: number = 0.8): void {
    this.ensureRunning();
    const ch = this.getPadChannel(pad.id);
    ch.setVolume(pad.volume);
    ch.setPan(pad.pan);
    ch.setFilter(pad.filterType, pad.filterFreq, pad.filterQ);
    this.drumSynth.trigger(pad.drumType, ch.input, velocity * pad.volume, pad.pitch);
  }

  triggerPadAt(pad: PadConfig, velocity: number, time: number): void {
    const ch = this.getPadChannel(pad.id);
    ch.setVolume(pad.volume);
    ch.setPan(pad.pan);
    ch.setFilter(pad.filterType, pad.filterFreq, pad.filterQ);
    this.drumSynth.triggerAt(pad.drumType, ch.input, velocity * pad.volume, time, pad.pitch);
  }

  updateMasterEffects(fx: MasterEffects): void {
    this.masterGain.gain.setTargetAtTime(fx.masterVolume, this.ctx.currentTime, 0.01);
    this.reverbGain.gain.setTargetAtTime(fx.reverbMix, this.ctx.currentTime, 0.01);
    this.reverbDry.gain.setTargetAtTime(1 - fx.reverbMix * 0.5, this.ctx.currentTime, 0.01);
    this.delayNode.delayTime.setTargetAtTime(fx.delayTime, this.ctx.currentTime, 0.01);
    this.delayFeedback.gain.setTargetAtTime(fx.delayFeedback, this.ctx.currentTime, 0.01);
    this.delayGain.gain.setTargetAtTime(fx.delayMix, this.ctx.currentTime, 0.01);
    this.delayDry.gain.setTargetAtTime(1 - fx.delayMix * 0.3, this.ctx.currentTime, 0.01);
    this.masterFilter.type = fx.filterType;
    this.masterFilter.frequency.setTargetAtTime(fx.filterFreq, this.ctx.currentTime, 0.01);
    this.masterFilter.Q.setTargetAtTime(fx.filterQ, this.ctx.currentTime, 0.01);
    this.masterCompressor.threshold.setTargetAtTime(fx.compThreshold, this.ctx.currentTime, 0.01);
    this.masterCompressor.ratio.setTargetAtTime(fx.compRatio, this.ctx.currentTime, 0.01);

    if (fx.reverbDecay !== this.reverbNode.buffer?.duration) {
      this.buildReverbIR(fx.reverbDecay);
    }
  }

  getAnalyserData(): Uint8Array {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getWaveformData(): Uint8Array {
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  async renderOffline(
    pads: PadConfig[],
    patterns: { steps: { active: boolean; velocity: number }[][]; length: number; swing: number }[],
    bpm: number,
    patternIndices: number[],
  ): Promise<AudioBuffer> {
    const stepDuration = 60 / bpm / 4;
    let totalSteps = 0;
    for (const pi of patternIndices) {
      totalSteps += patterns[pi].length;
    }
    const totalDuration = totalSteps * stepDuration + 2;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * 44100), 44100);
    const offlineSynth = new DrumSynth(offlineCtx);
    const masterGain = offlineCtx.createGain();
    masterGain.connect(offlineCtx.destination);

    let stepOffset = 0;
    for (const pi of patternIndices) {
      const pattern = patterns[pi];
      for (let step = 0; step < pattern.length; step++) {
        const globalStep = stepOffset + step;
        let time = globalStep * stepDuration;
        if (step % 2 === 1) {
          time += (pattern.swing / 100) * stepDuration * 0.5;
        }
        for (let padIdx = 0; padIdx < pads.length; padIdx++) {
          const stepData = pattern.steps[padIdx]?.[step];
          if (stepData?.active) {
            const pad = pads[padIdx];
            const padGain = offlineCtx.createGain();
            padGain.gain.value = pad.volume;
            const panner = offlineCtx.createStereoPanner();
            panner.pan.value = pad.pan;
            padGain.connect(panner).connect(masterGain);
            offlineSynth.triggerAt(pad.drumType, padGain, stepData.velocity, time, pad.pitch);
          }
        }
      }
      stepOffset += pattern.length;
    }

    return offlineCtx.startRendering();
  }
}

class PadChannel {
  input: GainNode;
  private panner: StereoPannerNode;
  private filter: BiquadFilterNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.input = ctx.createGain();
    this.panner = ctx.createStereoPanner();
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 20000;

    this.input.connect(this.filter);
    this.filter.connect(this.panner);
    this.panner.connect(destination);
  }

  setVolume(v: number): void {
    this.input.gain.value = v;
  }

  setPan(p: number): void {
    this.panner.pan.value = p;
  }

  setFilter(type: BiquadFilterType, freq: number, q: number): void {
    this.filter.type = type;
    this.filter.frequency.value = freq;
    this.filter.Q.value = q;
  }
}
