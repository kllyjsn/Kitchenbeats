import type { PadConfig } from '../types';

interface DisplayProps {
  bpm: number;
  currentStep: number;
  playing: boolean;
  recording: boolean;
  patternName: string;
  selectedPad: PadConfig;
  bank: string;
}

export function Display({
  bpm, currentStep, playing, recording,
  patternName, selectedPad, bank,
}: DisplayProps) {
  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3 font-mono relative overflow-hidden">
      {/* CRT scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      <div className="flex items-start justify-between relative">
        {/* Left info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg font-bold tabular-nums">{bpm}</span>
            <span className="text-amber-500/60 text-[10px]">BPM</span>
            <span className={`text-[10px] ${playing ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {playing ? 'PLAY' : 'STOP'}
            </span>
            {recording && (
              <span className="text-red-400 text-[10px] animate-pulse">REC</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-zinc-500">BANK</span>
            <span className="text-white font-bold">{bank}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500">{patternName}</span>
          </div>
        </div>

        {/* Step display */}
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-zinc-600 text-[10px]">STEP</span>
            <span className="text-amber-500 text-sm font-bold tabular-nums w-6 text-right">
              {currentStep >= 0 ? currentStep + 1 : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: selectedPad.color }}
            />
            <span className="text-zinc-300 text-[10px] font-bold">{selectedPad.name}</span>
          </div>
        </div>
      </div>

      {/* Beat indicators */}
      <div className="flex gap-1 mt-2">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              currentStep === i
                ? i % 4 === 0 ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'bg-amber-500/60'
                : i % 4 === 0 ? 'bg-zinc-700' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
