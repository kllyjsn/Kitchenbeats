export class DJDeck {
  private ctx: AudioContext;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private eqLow: BiquadFilterNode;
  private eqMid: BiquadFilterNode;
  private eqHigh: BiquadFilterNode;
  private filterNode: BiquadFilterNode;
  private analyser: AnalyserNode;
  private output: GainNode;

  private _playing = false;
  private _speed = 1;
  private startedAt = 0;
  private pauseOffset = 0;
  private _looping = false;
  private _loopStart = 0;
  private _loopEnd = 0;

  waveformData: Float32Array | null = null;
  detectedBPM = 0;
  fileName = '';

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    this.gainNode = ctx.createGain();
    this.eqLow = ctx.createBiquadFilter();
    this.eqMid = ctx.createBiquadFilter();
    this.eqHigh = ctx.createBiquadFilter();
    this.filterNode = ctx.createBiquadFilter();
    this.analyser = ctx.createAnalyser();
    this.output = ctx.createGain();

    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 320;
    this.eqLow.gain.value = 0;

    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 0.8;
    this.eqMid.gain.value = 0;

    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 3200;
    this.eqHigh.gain.value = 0;

    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;
    this.filterNode.Q.value = 1;

    this.analyser.fftSize = 2048;

    this.gainNode
      .connect(this.eqLow)
      .connect(this.eqMid)
      .connect(this.eqHigh)
      .connect(this.filterNode)
      .connect(this.analyser)
      .connect(this.output)
      .connect(destination);
  }

  get playing(): boolean { return this._playing; }
  get duration(): number { return this.buffer?.duration ?? 0; }
  get loaded(): boolean { return this.buffer !== null; }

  get position(): number {
    if (!this._playing) return this.pauseOffset;
    const elapsed = (this.ctx.currentTime - this.startedAt) * this._speed;
    const dur = this.duration;
    if (dur === 0) return 0;
    if (this._looping && this._loopEnd > this._loopStart) {
      const loopLen = this._loopEnd - this._loopStart;
      const pos = this._loopStart + ((this.pauseOffset - this._loopStart + elapsed) % loopLen);
      return pos;
    }
    return Math.min(this.pauseOffset + elapsed, dur);
  }

  async loadFile(file: File): Promise<void> {
    this.stop();
    const arrayBuffer = await file.arrayBuffer();
    this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.fileName = file.name;
    this.pauseOffset = 0;
    this.computeWaveform();
    this.detectedBPM = this.detectBPM();
  }

  private computeWaveform(): void {
    if (!this.buffer) return;
    const raw = this.buffer.getChannelData(0);
    const numBins = 800;
    const binSize = Math.floor(raw.length / numBins);
    this.waveformData = new Float32Array(numBins);
    for (let i = 0; i < numBins; i++) {
      let max = 0;
      const start = i * binSize;
      for (let j = start; j < start + binSize && j < raw.length; j++) {
        const abs = Math.abs(raw[j]);
        if (abs > max) max = abs;
      }
      this.waveformData[i] = max;
    }
  }

  private detectBPM(): number {
    if (!this.buffer) return 0;
    const data = this.buffer.getChannelData(0);
    const sr = this.buffer.sampleRate;

    // Simple onset-based BPM detection
    const blockSize = Math.floor(sr * 0.01);
    const energies: number[] = [];
    for (let i = 0; i < data.length - blockSize; i += blockSize) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += data[i + j] * data[i + j];
      }
      energies.push(sum / blockSize);
    }

    // Find onsets via energy differential
    const onsets: number[] = [];
    const threshold = 1.5;
    for (let i = 1; i < energies.length; i++) {
      if (energies[i] > energies[i - 1] * threshold && energies[i] > 0.001) {
        onsets.push(i);
      }
    }

    if (onsets.length < 4) return 120;

    // Compute inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < Math.min(onsets.length, 200); i++) {
      const dt = (onsets[i] - onsets[i - 1]) * blockSize / sr;
      if (dt > 0.2 && dt < 2.0) intervals.push(dt);
    }

    if (intervals.length === 0) return 120;

    // Median interval
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    let bpm = 60 / median;

    // Normalize to 70-160 range
    while (bpm > 160) bpm /= 2;
    while (bpm < 70) bpm *= 2;

    return Math.round(bpm);
  }

  play(): void {
    if (!this.buffer || this._playing) return;
    this.createSource();
    this._playing = true;
  }

  pause(): void {
    if (!this._playing) return;
    this.pauseOffset = this.position;
    this.destroySource();
    this._playing = false;
  }

  stop(): void {
    this.destroySource();
    this._playing = false;
    this.pauseOffset = 0;
  }

  seekTo(time: number): void {
    const wasPlaying = this._playing;
    if (wasPlaying) this.destroySource();
    this.pauseOffset = Math.max(0, Math.min(time, this.duration));
    if (wasPlaying) this.createSource();
  }

  private createSource(): void {
    if (!this.buffer) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this._speed;
    this.source.connect(this.gainNode);

    if (this._looping && this._loopEnd > this._loopStart) {
      this.source.loop = true;
      this.source.loopStart = this._loopStart;
      this.source.loopEnd = this._loopEnd;
    }

    this.source.onended = () => {
      if (this._playing && !this._looping) {
        this._playing = false;
        this.pauseOffset = 0;
      }
    };

    this.startedAt = this.ctx.currentTime;
    this.source.start(0, this.pauseOffset);
  }

  private destroySource(): void {
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch { /* noop */ }
      this.source.disconnect();
      this.source = null;
    }
  }

  setVolume(v: number): void {
    this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.5, v)), this.ctx.currentTime);
  }

  setSpeed(s: number): void {
    if (this._playing) {
      this.pauseOffset = this.position;
      this.startedAt = this.ctx.currentTime;
    }
    this._speed = Math.max(0.5, Math.min(2.0, s));
    if (this.source) {
      this.source.playbackRate.setValueAtTime(this._speed, this.ctx.currentTime);
    }
  }

  setEQ(band: 'low' | 'mid' | 'high', gain: number): void {
    const node = band === 'low' ? this.eqLow : band === 'mid' ? this.eqMid : this.eqHigh;
    node.gain.setValueAtTime(Math.max(-24, Math.min(12, gain)), this.ctx.currentTime);
  }

  setFilter(freq: number): void {
    this.filterNode.frequency.setValueAtTime(
      Math.max(20, Math.min(20000, freq)),
      this.ctx.currentTime
    );
  }

  setLoop(enabled: boolean, start?: number, end?: number): void {
    this._looping = enabled;
    if (start !== undefined) this._loopStart = start;
    if (end !== undefined) this._loopEnd = end;

    if (this.source) {
      this.source.loop = enabled;
      if (enabled) {
        this.source.loopStart = this._loopStart;
        this.source.loopEnd = this._loopEnd;
      }
    }
  }

  getAnalyser(): AnalyserNode { return this.analyser; }
  getOutputNode(): GainNode { return this.output; }

  destroy(): void {
    this.stop();
    this.gainNode.disconnect();
    this.output.disconnect();
  }
}
