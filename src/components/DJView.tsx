import { useRef, useEffect } from 'react';
import type { DJState } from '../hooks/useDJ';
import type { DeckState } from '../types';
import { Knob } from './Knob';
import { Play, Pause, Square, SkipBack, Repeat, Disc } from 'lucide-react';

interface Props {
  dj: DJState;
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function DeckWaveform({ state, onSeek }: { state: DeckState; onSeek: (t: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; });

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      const s = stateRef.current;
      if (!canvas || !s.waveformData) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const data = s.waveformData;
      const barW = width / data.length;
      const progress = s.duration > 0 ? s.position / s.duration : 0;
      const playIdx = Math.floor(progress * data.length);

      for (let i = 0; i < data.length; i++) {
        const h = data[i] * height * 0.9;
        const y = (height - h) / 2;
        ctx.fillStyle = i < playIdx ? '#f59e0b' : '#3f3f46';
        ctx.fillRect(i * barW, y, Math.max(1, barW - 0.5), h);
      }

      const px = progress * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      if (s.looping && s.duration > 0) {
        const ls = (s.loopStart / s.duration) * width;
        const le = (s.loopEnd / s.duration) * width;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        ctx.fillRect(ls, 0, le - ls, height);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.strokeRect(ls, 0, le - ls, height);
      }

      s.hotCues.forEach((cue, i) => {
        if (cue === null || s.duration === 0) return;
        const x = (cue / s.duration) * width;
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 5, 6);
        ctx.lineTo(x - 5, 6);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !state.duration) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(x * state.duration);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={80}
      onClick={handleClick}
      className="w-full h-20 rounded cursor-pointer bg-zinc-950"
    />
  );
}

function DeckPanel({
  deckId, state, dj
}: {
  deckId: 'A' | 'B'; state: DeckState; dj: DJState;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isLeft = deckId === 'A';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await dj.loadTrack(deckId, file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await dj.loadTrack(deckId, file);
  };

  return (
    <div
      className={`flex-1 bg-zinc-900/50 rounded-xl border p-3 space-y-3
        ${isLeft ? 'border-amber-900/30' : 'border-blue-900/30'}`}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* Deck Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
            ${isLeft ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {deckId}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate max-w-[200px]">
              {state.loaded ? state.fileName : 'No Track Loaded'}
            </div>
            {state.loaded && (
              <div className="text-[9px] text-zinc-500">
                {state.bpm > 0 ? `${state.bpm} BPM` : 'Analyzing...'} · {formatTime(state.duration)}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-2 py-1 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          LOAD
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* Waveform */}
      {state.loaded ? (
        <DeckWaveform state={state} onSeek={t => dj.seek(deckId, t)} />
      ) : (
        <div className="w-full h-20 rounded bg-zinc-950 flex items-center justify-center border border-dashed border-zinc-800">
          <span className="text-[10px] text-zinc-600">Drop audio file here or click LOAD</span>
        </div>
      )}

      {/* Time & Position */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className={isLeft ? 'text-amber-400' : 'text-blue-400'}>
          {formatTime(state.position)}
        </span>
        <span className="text-zinc-600">
          -{formatTime(Math.max(0, state.duration - state.position))}
        </span>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => dj.stop(deckId)}
          className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Stop"
        >
          <Square size={14} />
        </button>
        <button
          onClick={() => dj.seek(deckId, 0)}
          className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Return to start"
        >
          <SkipBack size={14} />
        </button>
        <button
          onClick={() => state.playing ? dj.pause(deckId) : dj.play(deckId)}
          disabled={!state.loaded}
          className={`p-3 rounded-xl font-bold transition-all ${
            state.playing
              ? isLeft ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
              : 'bg-zinc-700 text-white hover:bg-zinc-600'
          } disabled:opacity-30`}
          title={state.playing ? 'Pause' : 'Play'}
        >
          {state.playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={() => dj.sync(deckId)}
          disabled={!state.loaded}
          className="px-2 py-1.5 rounded-lg text-[9px] font-black bg-zinc-800 text-zinc-400 hover:text-green-400 transition-colors disabled:opacity-30"
          title="Sync BPM"
        >
          SYNC
        </button>
        <button
          onClick={() => dj.toggleLoop(deckId, 1)}
          className={`p-2 rounded-lg transition-colors ${
            state.looping
              ? 'bg-green-500/20 text-green-400'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="Loop"
        >
          <Repeat size={14} />
        </button>
      </div>

      {/* Speed / Pitch */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-zinc-600 w-10">SPEED</span>
        <input
          type="range"
          min={0.5} max={1.5} step={0.01}
          value={state.speed}
          onChange={e => dj.setSpeed(deckId, parseFloat(e.target.value))}
          className="flex-1 accent-amber-500 h-1"
        />
        <span className="text-[10px] text-zinc-400 font-mono w-12 text-right">
          {(state.speed * 100).toFixed(0)}%
        </span>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-zinc-600 w-10">VOL</span>
        <input
          type="range"
          min={0} max={1.5} step={0.01}
          value={state.volume}
          onChange={e => dj.setVolume(deckId, parseFloat(e.target.value))}
          className="flex-1 accent-amber-500 h-1"
        />
        <span className="text-[10px] text-zinc-400 font-mono w-12 text-right">
          {(state.volume * 100).toFixed(0)}%
        </span>
      </div>

      {/* EQ Knobs */}
      <div className="flex items-center justify-around">
        <Knob value={state.eqHigh} min={-24} max={12} label="HI"
          onChange={v => dj.setEQ(deckId, 'high', v)} size={36}
          color={isLeft ? '#f59e0b' : '#3b82f6'} />
        <Knob value={state.eqMid} min={-24} max={12} label="MID"
          onChange={v => dj.setEQ(deckId, 'mid', v)} size={36}
          color={isLeft ? '#f59e0b' : '#3b82f6'} />
        <Knob value={state.eqLow} min={-24} max={12} label="LO"
          onChange={v => dj.setEQ(deckId, 'low', v)} size={36}
          color={isLeft ? '#f59e0b' : '#3b82f6'} />
        <Knob value={state.filterFreq} min={20} max={20000} label="FILTER"
          onChange={v => dj.setFilter(deckId, v)} size={36}
          color={isLeft ? '#f59e0b' : '#3b82f6'} />
      </div>

      {/* Hot Cues */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-zinc-600 mr-1">CUE</span>
        {[0, 1, 2, 3].map(i => {
          const colors = [
            'bg-red-500/20 text-red-400 hover:bg-red-500/30',
            'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
            'bg-green-500/20 text-green-400 hover:bg-green-500/30',
            'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
          ];
          const hasCue = state.hotCues[i] !== null;
          return (
            <button
              key={i}
              onClick={() => hasCue ? dj.jumpToHotCue(deckId, i) : dj.setHotCue(deckId, i)}
              className={`flex-1 py-1.5 rounded text-[9px] font-bold transition-all ${
                hasCue ? colors[i] : 'bg-zinc-800/50 text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {hasCue ? formatTime(state.hotCues[i]!) : `${i + 1}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DJView({ dj }: Props) {
  return (
    <div className="space-y-4">
      {/* Turntable Header */}
      <div className="flex items-center justify-center gap-2 text-zinc-600">
        <Disc size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-[10px] uppercase tracking-widest font-bold">DJ Mode</span>
        <Disc size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      {/* Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeckPanel deckId="A" state={dj.deckA} dj={dj} />
        <DeckPanel deckId="B" state={dj.deckB} dj={dj} />
      </div>

      {/* Crossfader */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-amber-400 font-bold w-6 text-right">A</span>
          <div className="flex-1 flex flex-col items-center gap-1">
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={dj.crossfader}
              onChange={e => dj.setCrossfader(parseFloat(e.target.value))}
              className="w-full accent-white h-2"
            />
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Crossfader</span>
          </div>
          <span className="text-[10px] text-blue-400 font-bold w-6">B</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-[9px] text-zinc-600 space-x-3">
        <span>Drop audio files onto each deck</span>
        <span>·</span>
        <span>SYNC matches BPM between decks</span>
        <span>·</span>
        <span>Click waveform to seek</span>
      </div>
    </div>
  );
}
