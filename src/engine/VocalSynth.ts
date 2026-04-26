/**
 * VocalSynth — Procedural vocal synthesis using formant filters.
 *
 * Creates vocal-like sounds (chops, stabs, choir pads, "ooh", "aah", "eh")
 * by driving a harmonically-rich source through parallel formant bandpass
 * filters that replicate the resonances of the human vocal tract.
 *
 * No samples required — entirely Web Audio API.
 */

export type VowelType = 'a' | 'e' | 'i' | 'o' | 'u';
export type VocalStyle = 'chop' | 'stab' | 'pad' | 'choir' | 'whisper';

// Formant frequencies (Hz) for each vowel — F1, F2, F3
const FORMANTS: Record<VowelType, [number, number, number]> = {
  'a': [800, 1200, 2500],   // "aah"
  'e': [400, 2200, 2800],   // "eh"
  'i': [300, 2700, 3300],   // "ee"
  'o': [500, 900, 2500],    // "oh"
  'u': [350, 700, 2500],    // "ooh"
};

// Formant bandwidths (Q values)
const FORMANT_Q: [number, number, number] = [10, 12, 8];

interface VocalVoice {
  source: OscillatorNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
  formants: BiquadFilterNode[];
  vca: GainNode;
  output: GainNode;
  note: number;
  lfo?: OscillatorNode;
}

export class VocalSynth {
  private ctx: AudioContext;
  private destination: AudioNode;
  private voices: Map<number, VocalVoice> = new Map();
  private currentVowel: VowelType = 'a';
  private currentStyle: VocalStyle = 'chop';
  private noiseBuffer: AudioBuffer;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    // Pre-compute noise buffer for breathy quality
    const bufLen = ctx.sampleRate * 2;
    this.noiseBuffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  setVowel(v: VowelType): void { this.currentVowel = v; }
  setStyle(s: VocalStyle): void { this.currentStyle = s; }

  noteOn(note: number, velocity: number = 0.7, vowel?: VowelType, styleOverride?: VocalStyle): void {
    if (this.voices.has(note)) this.noteOff(note);

    const v = vowel ?? this.currentVowel;
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    const formantFreqs = FORMANTS[v];
    const style = styleOverride ?? this.currentStyle;

    const output = this.ctx.createGain();
    output.gain.setValueAtTime(0, this.ctx.currentTime);
    output.connect(this.destination);

    // Source: sawtooth for rich harmonics (voice-like)
    const source = this.ctx.createOscillator();
    source.type = style === 'whisper' ? 'triangle' : 'sawtooth';
    source.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Slight vibrato for realism
    let lfo: OscillatorNode | undefined;
    if (style === 'choir' || style === 'pad') {
      lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5 + Math.random() * 1.5, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(freq * 0.006, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(source.frequency);
      lfo.start(this.ctx.currentTime);
    }

    // Noise for breathiness
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;
    const noiseGain = this.ctx.createGain();
    const breathAmount = style === 'whisper' ? 0.3 : style === 'choir' ? 0.04 : 0.08;
    noiseGain.gain.setValueAtTime(breathAmount * velocity, this.ctx.currentTime);

    // Parallel formant filters
    const mergeNode = this.ctx.createGain();
    mergeNode.gain.setValueAtTime(0.4, this.ctx.currentTime);

    const formants: BiquadFilterNode[] = formantFreqs.map((fFreq, i) => {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(fFreq, this.ctx.currentTime);
      filter.Q.setValueAtTime(FORMANT_Q[i], this.ctx.currentTime);

      source.connect(filter);
      noiseSource.connect(filter);
      filter.connect(mergeNode);
      return filter;
    });

    mergeNode.connect(output);

    // VCA envelope — varies by style
    const vca = output;
    const now = this.ctx.currentTime;
    const vol = velocity * 0.6;

    if (style === 'chop') {
      vca.gain.setValueAtTime(0, now);
      vca.gain.linearRampToValueAtTime(vol, now + 0.01);
      vca.gain.exponentialRampToValueAtTime(vol * 0.3, now + 0.15);
      vca.gain.linearRampToValueAtTime(0.001, now + 0.3);
    } else if (style === 'stab') {
      vca.gain.setValueAtTime(0, now);
      vca.gain.linearRampToValueAtTime(vol, now + 0.005);
      vca.gain.exponentialRampToValueAtTime(vol * 0.6, now + 0.08);
      vca.gain.linearRampToValueAtTime(0.001, now + 0.2);
    } else if (style === 'pad' || style === 'choir') {
      vca.gain.setValueAtTime(0, now);
      vca.gain.linearRampToValueAtTime(vol * 0.7, now + 0.3);
    } else if (style === 'whisper') {
      vca.gain.setValueAtTime(0, now);
      vca.gain.linearRampToValueAtTime(vol * 0.4, now + 0.05);
    }

    source.start(now);
    noiseSource.start(now);

    // Auto-stop for chop and stab
    if (style === 'chop' || style === 'stab') {
      const dur = style === 'chop' ? 0.35 : 0.25;
      setTimeout(() => this.noteOff(note), dur * 1000);
    }

    this.voices.set(note, { source, noiseSource, noiseGain, formants, vca, output, note, lfo });
  }

  noteOff(note: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;

    const now = this.ctx.currentTime;
    voice.vca.gain.cancelScheduledValues(now);
    voice.vca.gain.setValueAtTime(voice.vca.gain.value, now);
    voice.vca.gain.linearRampToValueAtTime(0.001, now + 0.15);

    setTimeout(() => {
      try { voice.source.stop(); } catch { /* */ }
      try { voice.noiseSource.stop(); } catch { /* */ }
      if (voice.lfo) { try { voice.lfo.stop(); } catch { /* */ } voice.lfo.disconnect(); }
      voice.source.disconnect();
      voice.noiseSource.disconnect();
      voice.formants.forEach(f => f.disconnect());
      voice.output.disconnect();
    }, 200);

    this.voices.delete(note);
  }

  panic(): void {
    for (const note of this.voices.keys()) {
      this.noteOff(note);
    }
  }

  destroy(): void {
    this.panic();
  }
}
