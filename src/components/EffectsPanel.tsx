import type { MasterEffects } from '../types';
import { Knob } from './Knob';

interface EffectsPanelProps {
  effects: MasterEffects;
  onUpdate: (key: keyof MasterEffects, value: number | BiquadFilterType) => void;
}

export function EffectsPanel({ effects, onUpdate }: EffectsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Master Volume */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
        <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-3">Master</h3>
        <div className="flex gap-4 justify-center">
          <Knob
            value={effects.masterVolume}
            min={0} max={1}
            label="Volume"
            color="#ff9500"
            unit="%"
            onChange={v => onUpdate('masterVolume', v)}
          />
        </div>
      </div>

      {/* Reverb */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
        <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-3">Reverb</h3>
        <div className="flex gap-4 justify-center">
          <Knob
            value={effects.reverbMix}
            min={0} max={1}
            label="Mix"
            color="#5856d6"
            unit="%"
            onChange={v => onUpdate('reverbMix', v)}
          />
          <Knob
            value={effects.reverbDecay}
            min={0.1} max={5}
            label="Decay"
            color="#5856d6"
            unit="s"
            onChange={v => onUpdate('reverbDecay', v)}
          />
        </div>
      </div>

      {/* Delay */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
        <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-3">Delay</h3>
        <div className="flex gap-4 justify-center">
          <Knob
            value={effects.delayMix}
            min={0} max={1}
            label="Mix"
            color="#30b0c7"
            unit="%"
            onChange={v => onUpdate('delayMix', v)}
          />
          <Knob
            value={effects.delayTime}
            min={0.05} max={1.5}
            label="Time"
            color="#30b0c7"
            unit="s"
            onChange={v => onUpdate('delayTime', v)}
          />
          <Knob
            value={effects.delayFeedback}
            min={0} max={0.9}
            label="Feedback"
            color="#30b0c7"
            unit="%"
            onChange={v => onUpdate('delayFeedback', v)}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
        <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-3">Filter</h3>
        <div className="flex gap-4 items-end justify-center">
          <div className="flex flex-col items-center gap-1">
            <select
              value={effects.filterType}
              onChange={e => onUpdate('filterType', e.target.value as BiquadFilterType)}
              className="bg-zinc-800 text-zinc-300 text-[10px] rounded px-2 py-1 border border-zinc-700 outline-none"
            >
              <option value="lowpass">Low Pass</option>
              <option value="highpass">High Pass</option>
              <option value="bandpass">Band Pass</option>
              <option value="notch">Notch</option>
            </select>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Type</span>
          </div>
          <Knob
            value={effects.filterFreq}
            min={20} max={20000}
            label="Freq"
            color="#34c759"
            unit="Hz"
            onChange={v => onUpdate('filterFreq', v)}
          />
          <Knob
            value={effects.filterQ}
            min={0.1} max={20}
            label="Reso"
            color="#34c759"
            onChange={v => onUpdate('filterQ', v)}
          />
        </div>
      </div>

      {/* Compressor */}
      <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
        <h3 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-3">Compressor</h3>
        <div className="flex gap-4 justify-center">
          <Knob
            value={effects.compThreshold}
            min={-60} max={0}
            label="Threshold"
            color="#ff2d55"
            unit="dB"
            onChange={v => onUpdate('compThreshold', v)}
          />
          <Knob
            value={effects.compRatio}
            min={1} max={20}
            label="Ratio"
            color="#ff2d55"
            step={0.5}
            onChange={v => onUpdate('compRatio', v)}
          />
        </div>
      </div>
    </div>
  );
}
