import type { DrumType } from '../types';

/**
 * Analog-modeled drum synthesizer inspired by the TR-808, TR-909, and SP-1200.
 * Tuned for deep house, techno, and old-school hip hop production.
 * Every sound is procedurally generated via Web Audio — no samples needed.
 */
export class DrumSynth {
  private ctx: BaseAudioContext;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.buildNoiseBuffer();
  }

  private buildNoiseBuffer(): void {
    const length = Math.ceil(this.ctx.sampleRate * 3);
    this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  private noise(time: number, duration: number): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const maxOffset = Math.max(0, 3 - duration);
    src.start(time, Math.random() * maxOffset);
    src.stop(time + duration);
    return src;
  }

  private saturate(dest: AudioNode): WaveShaperNode {
    const ws = this.ctx.createWaveShaper();
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
    }
    ws.curve = curve;
    ws.oversample = '2x';
    ws.connect(dest);
    return ws;
  }

  trigger(type: DrumType, destination: AudioNode, velocity: number = 0.8, pitchOffset: number = 0): void {
    this.play(type, destination, Math.max(0, Math.min(1, velocity)), this.ctx.currentTime, pitchOffset);
  }

  triggerAt(type: DrumType, destination: AudioNode, velocity: number, time: number, pitchOffset: number = 0): void {
    this.play(type, destination, Math.max(0, Math.min(1, velocity)), time, pitchOffset);
  }

  private play(type: DrumType, dest: AudioNode, vel: number, t: number, p: number): void {
    switch (type) {
      case 'kick': return this.kick808(dest, vel, t, p);
      case 'snare': return this.snare909(dest, vel, t, p);
      case 'clap': return this.clap909(dest, vel, t, p);
      case 'closedHat': return this.closedHat909(dest, vel, t, p);
      case 'openHat': return this.openHat909(dest, vel, t, p);
      case 'rimshot': return this.rimshot(dest, vel, t, p);
      case 'lowTom': return this.tom808(dest, vel, t, 60, p);
      case 'midTom': return this.tom808(dest, vel, t, 100, p);
      case 'highTom': return this.tom808(dest, vel, t, 160, p);
      case 'cowbell': return this.cowbell808(dest, vel, t, p);
      case 'crash': return this.crash(dest, vel, t, p);
      case 'ride': return this.ride(dest, vel, t, p);
      case 'shaker': return this.shaker(dest, vel, t);
      case 'conga': return this.conga(dest, vel, t, p);
      case 'claves': return this.claves(dest, vel, t, p);
      case 'clave2': return this.perc(dest, vel, t, p);
    }
  }

  // ── 808 KICK ──────────────────────────────────────────────────────────
  // Deep, booming sub-bass. The foundation of hip hop and house.
  // Sine body with long pitch sweep, subtle click transient, warm saturation.
  private kick808(dest: AudioNode, vel: number, t: number, p: number): void {
    const sat = this.saturate(dest);
    const pitchMul = Math.pow(2, p / 12);

    // Sub body — the main event
    const body = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(160 * pitchMul, t);
    body.frequency.exponentialRampToValueAtTime(42 * pitchMul, t + 0.12);
    body.frequency.setTargetAtTime(38 * pitchMul, t + 0.12, 0.15);
    bodyGain.gain.setValueAtTime(vel * 1.4, t);
    bodyGain.gain.setValueAtTime(vel * 1.3, t + 0.02);
    bodyGain.gain.setTargetAtTime(0.001, t + 0.02, 0.28);
    body.connect(bodyGain).connect(sat);
    body.start(t);
    body.stop(t + 1.2);

    // Second harmonic for chest thump
    const harm = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harm.type = 'sine';
    harm.frequency.setValueAtTime(320 * pitchMul, t);
    harm.frequency.exponentialRampToValueAtTime(80 * pitchMul, t + 0.04);
    harmGain.gain.setValueAtTime(vel * 0.35, t);
    harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    harm.connect(harmGain).connect(sat);
    harm.start(t);
    harm.stop(t + 0.06);

    // Click transient — gives it that analog punch
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    const clickFilter = this.ctx.createBiquadFilter();
    click.type = 'square';
    click.frequency.setValueAtTime(1200 * pitchMul, t);
    click.frequency.exponentialRampToValueAtTime(200, t + 0.008);
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(800, t);
    clickFilter.Q.setValueAtTime(2, t);
    clickGain.gain.setValueAtTime(vel * 0.15, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(clickFilter).connect(clickGain).connect(sat);
    click.start(t);
    click.stop(t + 0.015);
  }

  // ── 909 SNARE ─────────────────────────────────────────────────────────
  // Tight, punchy snare with a tonal body and bright noise layer.
  // The backbone of house and techno.
  private snare909(dest: AudioNode, vel: number, t: number, p: number): void {
    const pitchMul = Math.pow(2, p / 12);

    // Tonal body — two detuned oscillators for richness
    const body1 = this.ctx.createOscillator();
    const body2 = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body1.type = 'sine';
    body1.frequency.setValueAtTime(189 * pitchMul, t);
    body1.frequency.exponentialRampToValueAtTime(120 * pitchMul, t + 0.04);
    body2.type = 'sine';
    body2.frequency.setValueAtTime(238 * pitchMul, t);
    body2.frequency.exponentialRampToValueAtTime(140 * pitchMul, t + 0.035);
    bodyGain.gain.setValueAtTime(vel * 0.55, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    body1.connect(bodyGain);
    body2.connect(bodyGain);
    bodyGain.connect(dest);
    body1.start(t);
    body1.stop(t + 0.18);
    body2.start(t);
    body2.stop(t + 0.18);

    // Noise layer — bright, sizzly snare wires
    const n = this.noise(t, 0.28);
    const nGain = this.ctx.createGain();
    const hp = this.ctx.createBiquadFilter();
    const lp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1800, t);
    hp.Q.setValueAtTime(0.8, t);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(9000, t);
    nGain.gain.setValueAtTime(vel * 0.55, t);
    nGain.gain.setValueAtTime(vel * 0.45, t + 0.02);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    n.connect(hp).connect(lp).connect(nGain).connect(dest);
  }

  // ── 909 CLAP ──────────────────────────────────────────────────────────
  // Layered noise bursts with that classic flam spacing.
  // Essential for house music builds and drops.
  private clap909(dest: AudioNode, vel: number, t: number, p: number): void {
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400 * Math.pow(2, p / 12), t);
    bp.Q.setValueAtTime(1.5, t);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(6000, t);
    bp.connect(lp).connect(dest);

    // 4 quick noise bursts for the flam
    const flamSpacing = [0, 0.012, 0.024, 0.035];
    for (let i = 0; i < flamSpacing.length; i++) {
      const n = this.noise(t + flamSpacing[i], 0.012);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vel * (0.4 + i * 0.12), t + flamSpacing[i]);
      g.gain.exponentialRampToValueAtTime(0.001, t + flamSpacing[i] + 0.012);
      n.connect(g).connect(bp);
    }

    // Reverb-like tail
    const tail = this.noise(t + 0.04, 0.35);
    const tailGain = this.ctx.createGain();
    tailGain.gain.setValueAtTime(vel * 0.45, t + 0.04);
    tailGain.gain.setTargetAtTime(0.001, t + 0.04, 0.09);
    tail.connect(tailGain).connect(bp);
  }

  // ── 909 CLOSED HI-HAT ────────────────────────────────────────────────
  // Crisp, metallic, short. The pulse of house and techno.
  // 6 square oscillators at inharmonic ratios for that metallic shimmer.
  private closedHat909(dest: AudioNode, vel: number, t: number, p: number): void {
    const ratios = [2.0, 3.0, 4.16, 5.43, 6.79, 8.21];
    const base = 42 * Math.pow(2, p / 12);

    const mixGain = this.ctx.createGain();
    mixGain.gain.setValueAtTime(vel * 0.28, t);
    mixGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(7500, t);
    hp.Q.setValueAtTime(0.7, t);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'peaking';
    bp.frequency.setValueAtTime(10000, t);
    bp.gain.setValueAtTime(4, t);
    bp.Q.setValueAtTime(2, t);

    mixGain.connect(hp).connect(bp).connect(dest);

    for (const r of ratios) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(base * r, t);
      osc.connect(mixGain);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    // Noise sizzle layer
    const n = this.noise(t, 0.04);
    const nGain = this.ctx.createGain();
    const nHp = this.ctx.createBiquadFilter();
    nHp.type = 'highpass';
    nHp.frequency.setValueAtTime(9000, t);
    nGain.gain.setValueAtTime(vel * 0.08, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    n.connect(nHp).connect(nGain).connect(dest);
  }

  // ── 909 OPEN HI-HAT ──────────────────────────────────────────────────
  // Sizzling, sustaining, the groove rider. Longer decay than closed.
  private openHat909(dest: AudioNode, vel: number, t: number, p: number): void {
    const ratios = [2.0, 3.0, 4.16, 5.43, 6.79, 8.21];
    const base = 42 * Math.pow(2, p / 12);

    const mixGain = this.ctx.createGain();
    mixGain.gain.setValueAtTime(vel * 0.25, t);
    mixGain.gain.setTargetAtTime(0.001, t, 0.18);

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6500, t);

    const peak = this.ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(9500, t);
    peak.gain.setValueAtTime(3, t);
    peak.Q.setValueAtTime(1.5, t);

    mixGain.connect(hp).connect(peak).connect(dest);

    for (const r of ratios) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(base * r, t);
      osc.connect(mixGain);
      osc.start(t);
      osc.stop(t + 0.6);
    }

    // Noise shimmer
    const n = this.noise(t, 0.5);
    const nGain = this.ctx.createGain();
    const nHp = this.ctx.createBiquadFilter();
    nHp.type = 'highpass';
    nHp.frequency.setValueAtTime(8000, t);
    nGain.gain.setValueAtTime(vel * 0.1, t);
    nGain.gain.setTargetAtTime(0.001, t, 0.15);
    n.connect(nHp).connect(nGain).connect(dest);
  }

  // ── RIMSHOT ───────────────────────────────────────────────────────────
  // Sharp, cutting rimshot. Cuts through any mix.
  private rimshot(dest: AudioNode, vel: number, t: number, p: number): void {
    const pitchMul = Math.pow(2, p / 12);

    // Body tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(850 * pitchMul, t);
    osc.frequency.exponentialRampToValueAtTime(400 * pitchMul, t + 0.01);
    gain.gain.setValueAtTime(vel * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.045);

    // Crack
    const n = this.noise(t, 0.025);
    const nGain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3500 * pitchMul, t);
    bp.Q.setValueAtTime(4, t);
    nGain.gain.setValueAtTime(vel * 0.4, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    n.connect(bp).connect(nGain).connect(dest);
  }

  // ── 808 TOM ───────────────────────────────────────────────────────────
  // Warm, round analog tom. Pitch drops smoothly for that classic feel.
  private tom808(dest: AudioNode, vel: number, t: number, baseFreq: number, p: number): void {
    const f = baseFreq * Math.pow(2, p / 12);
    const sat = this.saturate(dest);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    osc.frequency.setTargetAtTime(f * 0.9, t + 0.04, 0.1);
    gain.gain.setValueAtTime(vel * 0.85, t);
    gain.gain.setTargetAtTime(0.001, t, 0.18);
    osc.connect(gain).connect(sat);
    osc.start(t);
    osc.stop(t + 0.6);

    // Second harmonic for warmth
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(f * 2.5, t);
    osc2.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.02);
    g2.gain.setValueAtTime(vel * 0.2, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc2.connect(g2).connect(sat);
    osc2.start(t);
    osc2.stop(t + 0.08);
  }

  // ── 808 COWBELL ───────────────────────────────────────────────────────
  // Two detuned square waves through a bandpass — the definitive 808 cowbell.
  private cowbell808(dest: AudioNode, vel: number, t: number, p: number): void {
    const pitchMul = Math.pow(2, p / 12);
    const f1 = 540 * pitchMul;
    const f2 = 800 * pitchMul;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime((f1 + f2) / 2, t);
    bp.Q.setValueAtTime(6, t);
    bp.connect(dest);

    for (const freq of [f1, f2]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vel * 0.22, t);
      gain.gain.setValueAtTime(vel * 0.15, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain).connect(bp);
      osc.start(t);
      osc.stop(t + 0.35);
    }
  }

  // ── CRASH ─────────────────────────────────────────────────────────────
  // Dark, washy crash. Not too bright — suited for deeper genres.
  private crash(dest: AudioNode, vel: number, t: number, p: number): void {
    const pitchMul = Math.pow(2, p / 12);

    // Noise wash
    const n = this.noise(t, 2.5);
    const nGain = this.ctx.createGain();
    const hp = this.ctx.createBiquadFilter();
    const lp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(3500 * pitchMul, t);
    hp.frequency.setTargetAtTime(2500, t, 0.5);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(11000, t);
    lp.frequency.setTargetAtTime(7000, t, 0.8);
    nGain.gain.setValueAtTime(vel * 0.35, t);
    nGain.gain.setTargetAtTime(0.001, t, 0.7);
    n.connect(hp).connect(lp).connect(nGain).connect(dest);

    // Metallic shimmer
    const shimmer = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2800 * pitchMul, t);
    sGain.gain.setValueAtTime(vel * 0.04, t);
    sGain.gain.setTargetAtTime(0.001, t, 0.4);
    shimmer.connect(sGain).connect(dest);
    shimmer.start(t);
    shimmer.stop(t + 2.0);
  }

  // ── RIDE ──────────────────────────────────────────────────────────────
  // Jazz-influenced ride with bell overtone. Mark Farina approved.
  private ride(dest: AudioNode, vel: number, t: number, p: number): void {
    const pitchMul = Math.pow(2, p / 12);

    // Bell tone
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(5200 * pitchMul, t);
    bellGain.gain.setValueAtTime(vel * 0.07, t);
    bellGain.gain.setTargetAtTime(0.001, t, 0.3);
    bell.connect(bellGain).connect(dest);
    bell.start(t);
    bell.stop(t + 1.2);

    // Second bell partial
    const bell2 = this.ctx.createOscillator();
    const bell2Gain = this.ctx.createGain();
    bell2.type = 'sine';
    bell2.frequency.setValueAtTime(3700 * pitchMul, t);
    bell2Gain.gain.setValueAtTime(vel * 0.04, t);
    bell2Gain.gain.setTargetAtTime(0.001, t, 0.25);
    bell2.connect(bell2Gain).connect(dest);
    bell2.start(t);
    bell2.stop(t + 1.0);

    // Wash
    const n = this.noise(t, 1.0);
    const nGain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(7500 * pitchMul, t);
    bp.Q.setValueAtTime(2.5, t);
    nGain.gain.setValueAtTime(vel * 0.15, t);
    nGain.gain.setTargetAtTime(0.001, t, 0.25);
    n.connect(bp).connect(nGain).connect(dest);
  }

  // ── SHAKER ────────────────────────────────────────────────────────────
  // Organic, shuffled shaker. Essential for house grooves.
  private shaker(dest: AudioNode, vel: number, t: number): void {
    const n = this.noise(t, 0.12);
    const nGain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    const hp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(8500, t);
    bp.Q.setValueAtTime(3, t);
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6000, t);
    // Envelope: quick attack, natural decay
    nGain.gain.setValueAtTime(0, t);
    nGain.gain.linearRampToValueAtTime(vel * 0.2, t + 0.005);
    nGain.gain.setTargetAtTime(vel * 0.12, t + 0.005, 0.015);
    nGain.gain.setTargetAtTime(0.001, t + 0.03, 0.03);
    n.connect(hp).connect(bp).connect(nGain).connect(dest);
  }

  // ── CONGA ─────────────────────────────────────────────────────────────
  // Deep, resonant conga. Old school hip hop flavor.
  private conga(dest: AudioNode, vel: number, t: number, p: number): void {
    const f = 240 * Math.pow(2, p / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.4, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.015);
    gain.gain.setValueAtTime(vel * 0.65, t);
    gain.gain.setTargetAtTime(0.001, t, 0.12);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.5);

    // Slap transient
    const n = this.noise(t, 0.015);
    const nGain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f * 4, t);
    bp.Q.setValueAtTime(8, t);
    nGain.gain.setValueAtTime(vel * 0.2, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    n.connect(bp).connect(nGain).connect(dest);
  }

  // ── CLAVES ────────────────────────────────────────────────────────────
  // Sharp, woody claves. Classic Latin percussion element.
  private claves(dest: AudioNode, vel: number, t: number, p: number): void {
    const f = 2400 * Math.pow(2, p / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const bp = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f, t);
    bp.Q.setValueAtTime(45, t);
    gain.gain.setValueAtTime(vel * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(bp).connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // ── PERC ──────────────────────────────────────────────────────────────
  // Tuned percussion hit. Useful for melodic accents.
  private perc(dest: AudioNode, vel: number, t: number, p: number): void {
    const f = 420 * Math.pow(2, p / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f * 2, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.01);
    gain.gain.setValueAtTime(vel * 0.4, t);
    gain.gain.setTargetAtTime(0.001, t, 0.06);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.25);

    // Click
    const click = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(f * 6, t);
    cGain.gain.setValueAtTime(vel * 0.12, t);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
    click.connect(cGain).connect(dest);
    click.start(t);
    click.stop(t + 0.008);
  }
}
