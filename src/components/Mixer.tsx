import type { PadConfig } from '../types';
import { Knob } from './Knob';
import { Volume2, VolumeX } from 'lucide-react';

interface MixerProps {
  pads: PadConfig[];
  selectedPad: number;
  onUpdatePad: (index: number, updates: Partial<PadConfig>) => void;
  onSelectPad: (index: number) => void;
}

export function Mixer({ pads, selectedPad, onUpdatePad, onSelectPad }: MixerProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Channel strips */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {pads.map((pad, i) => (
          <div
            key={i}
            className={`
              flex flex-col items-center gap-2 min-w-[52px] px-1 py-2 rounded-lg transition-all
              ${selectedPad === i ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/[0.02]'}
            `}
            onClick={() => onSelectPad(i)}
          >
            {/* Pad name */}
            <span className="text-[8px] text-zinc-400 font-bold tracking-wider truncate w-full text-center">
              {pad.name}
            </span>

            {/* Color dot */}
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: pad.color, boxShadow: `0 0 6px ${pad.color}40` }}
            />

            {/* Volume fader */}
            <div className="flex flex-col items-center h-24 relative">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(pad.volume * 100)}
                onChange={e => onUpdatePad(i, { volume: parseInt(e.target.value) / 100 })}
                className="h-20 w-2 accent-white appearance-none cursor-pointer"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                }}
              />
              <span className="text-[9px] text-zinc-500 font-mono mt-1 tabular-nums">
                {Math.round(pad.volume * 100)}
              </span>
            </div>

            {/* Pan knob */}
            <Knob
              value={pad.pan}
              min={-1}
              max={1}
              label="Pan"
              size={32}
              color={pad.color}
              bipolar
              onChange={v => onUpdatePad(i, { pan: v })}
            />

            {/* Mute/Solo */}
            <div className="flex gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePad(i, { muted: !pad.muted });
                }}
                className={`w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center transition-all ${
                  pad.muted
                    ? 'bg-red-500/30 text-red-400'
                    : 'bg-zinc-800 text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {pad.muted ? <VolumeX size={10} /> : 'M'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePad(i, { soloed: !pad.soloed });
                }}
                className={`w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center transition-all ${
                  pad.soloed
                    ? 'bg-yellow-500/30 text-yellow-400'
                    : 'bg-zinc-800 text-zinc-600 hover:text-zinc-400'
                }`}
              >
                S
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected pad detail */}
      {pads[selectedPad] && (
        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: pads[selectedPad].color }}
            />
            <span className="text-xs font-bold text-white">{pads[selectedPad].name}</span>
            <Volume2 size={12} className="text-zinc-500 ml-auto" />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Knob
              value={pads[selectedPad].volume}
              min={0} max={1}
              label="Volume"
              color={pads[selectedPad].color}
              unit="%"
              onChange={v => onUpdatePad(selectedPad, { volume: v })}
            />
            <Knob
              value={pads[selectedPad].pan}
              min={-1} max={1}
              label="Pan"
              color={pads[selectedPad].color}
              bipolar
              onChange={v => onUpdatePad(selectedPad, { pan: v })}
            />
            <Knob
              value={pads[selectedPad].pitch}
              min={-12} max={12}
              label="Pitch"
              color={pads[selectedPad].color}
              unit="st"
              step={1}
              bipolar
              onChange={v => onUpdatePad(selectedPad, { pitch: v })}
            />
            <Knob
              value={pads[selectedPad].filterFreq}
              min={20} max={20000}
              label="Filter"
              color={pads[selectedPad].color}
              unit="Hz"
              onChange={v => onUpdatePad(selectedPad, { filterFreq: v })}
            />
            <Knob
              value={pads[selectedPad].filterQ}
              min={0.1} max={20}
              label="Reso"
              color={pads[selectedPad].color}
              onChange={v => onUpdatePad(selectedPad, { filterQ: v })}
            />
            <Knob
              value={pads[selectedPad].reverbSend}
              min={0} max={1}
              label="Reverb"
              color={pads[selectedPad].color}
              unit="%"
              onChange={v => onUpdatePad(selectedPad, { reverbSend: v })}
            />
            <Knob
              value={pads[selectedPad].delaySend}
              min={0} max={1}
              label="Delay"
              color={pads[selectedPad].color}
              unit="%"
              onChange={v => onUpdatePad(selectedPad, { delaySend: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
