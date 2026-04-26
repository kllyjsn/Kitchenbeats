import { useCallback, useRef, useState } from 'react';
import { Play, Square, Circle, Download, Trash2 } from 'lucide-react';

interface TransportProps {
  bpm: number;
  playing: boolean;
  recording: boolean;
  onBpmChange: (bpm: number) => void;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onExport: () => void;
  onClear: () => void;
  swing: number;
  onSwingChange: (swing: number) => void;
  stepLength: number;
  onStepLengthChange: (len: number) => void;
}

export function Transport({
  bpm, playing, recording,
  onBpmChange, onTogglePlay, onToggleRecord,
  onExport, onClear,
  swing, onSwingChange,
  stepLength, onStepLengthChange,
}: TransportProps) {
  const [, setTapTimes] = useState<number[]>([]);
  const tapTimeoutRef = useRef<number>(0);

  const handleTap = useCallback(() => {
    const now = performance.now();
    clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = window.setTimeout(() => setTapTimes([]), 3000);

    setTapTimes(prev => {
      const times = [...prev, now].slice(-8);
      if (times.length >= 2) {
        const intervals = [];
        for (let i = 1; i < times.length; i++) {
          intervals.push(times[i] - times[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const detectedBpm = Math.round(60000 / avg);
        if (detectedBpm >= 30 && detectedBpm <= 300) {
          onBpmChange(detectedBpm);
        }
      }
      return times;
    });
  }, [onBpmChange]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Play/Stop */}
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePlay}
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all
            ${playing
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'}
          `}
        >
          {playing ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>

        <button
          onClick={onToggleRecord}
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all
            ${recording
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'}
          `}
        >
          <Circle size={14} fill={recording ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* BPM */}
      <div className="flex items-center gap-2 bg-zinc-900/80 rounded-lg px-3 py-1.5 border border-zinc-800">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">BPM</span>
        <button
          onClick={() => onBpmChange(Math.max(30, bpm - 1))}
          className="text-zinc-400 hover:text-white text-lg font-mono leading-none w-5 h-5 flex items-center justify-center"
        >-</button>
        <input
          type="number"
          value={bpm}
          onChange={e => onBpmChange(Math.max(30, Math.min(300, parseInt(e.target.value) || 90)))}
          className="w-12 bg-transparent text-center text-white font-mono text-lg font-bold outline-none tabular-nums
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onBpmChange(Math.min(300, bpm + 1))}
          className="text-zinc-400 hover:text-white text-lg font-mono leading-none w-5 h-5 flex items-center justify-center"
        >+</button>
        <button
          onClick={handleTap}
          className="text-[10px] text-zinc-400 hover:text-amber-400 uppercase tracking-wider font-bold
                     px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors ml-1"
        >
          TAP
        </button>
      </div>

      {/* Swing */}
      <div className="flex items-center gap-2 bg-zinc-900/80 rounded-lg px-3 py-1.5 border border-zinc-800">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Swing</span>
        <input
          type="range"
          min={0}
          max={100}
          value={swing}
          onChange={e => onSwingChange(parseInt(e.target.value))}
          className="w-16 h-1 accent-amber-500"
        />
        <span className="text-xs text-zinc-300 font-mono w-8 text-right tabular-nums">{swing}%</span>
      </div>

      {/* Step Length */}
      <div className="flex items-center gap-1 bg-zinc-900/80 rounded-lg px-3 py-1.5 border border-zinc-800">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mr-1">Steps</span>
        {[16, 32].map(len => (
          <button
            key={len}
            onClick={() => onStepLengthChange(len)}
            className={`text-xs px-2 py-0.5 rounded font-mono transition-all ${
              stepLength === len
                ? 'bg-amber-500/20 text-amber-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {len}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onClear}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     bg-zinc-800 text-zinc-400 border border-zinc-700
                     hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
          title="Clear Pattern"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={onExport}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     bg-zinc-800 text-zinc-400 border border-zinc-700
                     hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
          title="Export WAV"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}
