import type { DrumType } from '../types';

export class DrumSynth {
  private ctx: BaseAudioContext;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
  }

  trigger(
    type: DrumType,
    destination: AudioNode,
    velocity: number = 0.8,
    pitchOffset: number = 0,
  ): void {
    const v = Math.max(0, Math.min(1, velocity));
    const now = this.ctx.currentTime;

    switch (type) {
      case 'kick': return this.kick(destination, v, now, pitchOffset);
      case 'snare': return this.snare(destination, v, now, pitchOffset);
      case 'clap': return this.clap(destination, v, now, pitchOffset);
      case 'closedHat': return this.closedHat(destination, v, now, pitchOffset);
      case 'openHat': return this.openHat(destination, v, now, pitchOffset);
      case 'rimshot': return this.rimshot(destination, v, now, pitchOffset);
      case 'lowTom': return this.tom(destination, v, now, 80, pitchOffset);
      case 'midTom': return this.tom(destination, v, now, 120, pitchOffset);
      case 'highTom': return this.tom(destination, v, now, 180, pitchOffset);
      case 'cowbell': return this.cowbell(destination, v, now, pitchOffset);
      case 'crash': return this.crash(destination, v, now, pitchOffset);
      case 'ride': return this.ride(destination, v, now, pitchOffset);
      case 'shaker': return this.shaker(destination, v, now);
      case 'conga': return this.conga(destination, v, now, pitchOffset);
      case 'claves': return this.claves(destination, v, now, pitchOffset);
      case 'clave2': return this.clave2(destination, v, now, pitchOffset);
    }
  }

  triggerAt(
    type: DrumType,
    destination: AudioNode,
    velocity: number,
    time: number,
    pitchOffset: number = 0,
  ): void {
    const v = Math.max(0, Math.min(1, velocity));
    switch (type) {
      case 'kick': return this.kick(destination, v, time, pitchOffset);
      case 'snare': return this.snare(destination, v, time, pitchOffset);
      case 'clap': return this.clap(destination, v, time, pitchOffset);
      case 'closedHat': return this.closedHat(destination, v, time, pitchOffset);
      case 'openHat': return this.openHat(destination, v, time, pitchOffset);
      case 'rimshot': return this.rimshot(destination, v, time, pitchOffset);
      case 'lowTom': return this.tom(destination, v, time, 80, pitchOffset);
      case 'midTom': return this.tom(destination, v, time, 120, pitchOffset);
      case 'highTom': return this.tom(destination, v, time, 180, pitchOffset);
      case 'cowbell': return this.cowbell(destination, v, time, pitchOffset);
      case 'crash': return this.crash(destination, v, time, pitchOffset);
      case 'ride': return this.ride(destination, v, time, pitchOffset);
      case 'shaker': return this.shaker(destination, v, time);
      case 'conga': return this.conga(destination, v, time, pitchOffset);
      case 'claves': return this.claves(destination, v, time, pitchOffset);
      case 'clave2': return this.clave2(destination, v, time, pitchOffset);
    }
  }

  private kick(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const baseFreq = 150 * Math.pow(2, pitch / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(30 * Math.pow(2, pitch / 12), time + 0.08);
    gain.gain.setValueAtTime(vel * 1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.5);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, time);
    osc2.frequency.exponentialRampToValueAtTime(20, time + 0.03);
    gain2.gain.setValueAtTime(vel * 0.7, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc2.connect(gain2).connect(dest);
    osc2.start(time);
    osc2.stop(time + 0.05);
  }

  private snare(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const bodyFreq = 180 * Math.pow(2, pitch / 12);
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bodyFreq, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
    oscGain.gain.setValueAtTime(vel * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.15);

    const noise = this.createNoise(time, 0.2);
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2000, time);
    noiseGain.gain.setValueAtTime(vel * 0.6, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    noise.connect(noiseFilter).connect(noiseGain).connect(dest);
  }

  private clap(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 * Math.pow(2, pitch / 12), time);
    filter.Q.setValueAtTime(2, time);

    for (let i = 0; i < 3; i++) {
      const noise = this.createNoise(time + i * 0.01, 0.02);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(vel * 0.8, time + i * 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, time + i * 0.01 + 0.02);
      noise.connect(env).connect(filter);
    }

    const noiseTail = this.createNoise(time + 0.03, 0.25);
    const tailGain = this.ctx.createGain();
    tailGain.gain.setValueAtTime(vel * 0.5, time + 0.03);
    tailGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    noiseTail.connect(tailGain).connect(filter);
    filter.connect(dest);
  }

  private closedHat(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    const baseFreq = 40 * Math.pow(2, pitch / 12);
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(vel * 0.3, time);
    masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(7000, time);
    masterGain.connect(hp).connect(dest);

    for (const r of ratios) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq * r, time);
      osc.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.08);
    }
  }

  private openHat(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    const baseFreq = 40 * Math.pow(2, pitch / 12);
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(vel * 0.3, time);
    masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6000, time);
    masterGain.connect(hp).connect(dest);

    for (const r of ratios) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq * r, time);
      osc.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.5);
    }
  }

  private rimshot(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 * Math.pow(2, pitch / 12), time);
    gain.gain.setValueAtTime(vel * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.04);

    const noise = this.createNoise(time, 0.02);
    const ng = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3000, time);
    bp.Q.setValueAtTime(5, time);
    ng.gain.setValueAtTime(vel * 0.5, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    noise.connect(bp).connect(ng).connect(dest);
  }

  private tom(dest: AudioNode, vel: number, time: number, freq: number, pitch: number): void {
    const f = freq * Math.pow(2, pitch / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(f, time + 0.05);
    gain.gain.setValueAtTime(vel * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private cowbell(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const f1 = 545 * Math.pow(2, pitch / 12);
    const f2 = 815 * Math.pow(2, pitch / 12);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f1, time);
    bp.Q.setValueAtTime(8, time);
    bp.connect(dest);

    for (const f of [f1, f2]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, time);
      gain.gain.setValueAtTime(vel * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      osc.connect(gain).connect(bp);
      osc.start(time);
      osc.stop(time + 0.4);
    }
  }

  private crash(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const noise = this.createNoise(time, 2.0);
    const gain = this.ctx.createGain();
    const hp = this.ctx.createBiquadFilter();
    const lp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(4000 * Math.pow(2, pitch / 12), time);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(12000, time);
    gain.gain.setValueAtTime(vel * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
    noise.connect(hp).connect(lp).connect(gain).connect(dest);

    const shimmer = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(3000 * Math.pow(2, pitch / 12), time);
    sg.gain.setValueAtTime(vel * 0.05, time);
    sg.gain.exponentialRampToValueAtTime(0.001, time + 1.5);
    shimmer.connect(sg).connect(dest);
    shimmer.start(time);
    shimmer.stop(time + 1.5);
  }

  private ride(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const noise = this.createNoise(time, 1.0);
    const gain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(8000 * Math.pow(2, pitch / 12), time);
    bp.Q.setValueAtTime(3, time);
    gain.gain.setValueAtTime(vel * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);
    noise.connect(bp).connect(gain).connect(dest);

    const ping = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(5500 * Math.pow(2, pitch / 12), time);
    pg.gain.setValueAtTime(vel * 0.08, time);
    pg.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    ping.connect(pg).connect(dest);
    ping.start(time);
    ping.stop(time + 0.6);
  }

  private shaker(dest: AudioNode, vel: number, time: number): void {
    const noise = this.createNoise(time, 0.1);
    const gain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(9000, time);
    bp.Q.setValueAtTime(5, time);
    gain.gain.setValueAtTime(vel * 0.2, time);
    gain.gain.setValueAtTime(vel * 0.25, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    noise.connect(bp).connect(gain).connect(dest);
  }

  private conga(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const f = 250 * Math.pow(2, pitch / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.3, time);
    osc.frequency.exponentialRampToValueAtTime(f, time + 0.02);
    gain.gain.setValueAtTime(vel * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  private claves(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const f = 2500 * Math.pow(2, pitch / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, time);
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f, time);
    bp.Q.setValueAtTime(40, time);
    gain.gain.setValueAtTime(vel * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.connect(bp).connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  private clave2(dest: AudioNode, vel: number, time: number, pitch: number): void {
    const f = 1800 * Math.pow(2, pitch / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, time);
    gain.gain.setValueAtTime(vel * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  private createNoise(time: number, duration: number): AudioBufferSourceNode {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.start(time);
    source.stop(time + duration);
    return source;
  }
}
