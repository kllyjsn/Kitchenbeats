import { Fragment } from 'react';
import type { SynthState } from '../hooks/useSynth';
import { SYNTH_PRESETS, noteName } from '../types';
import { Knob } from './Knob';

interface Props {
  synth: SynthState;
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, -1, 6, 8, 10, -1];

function PianoKeyboard({ synth }: Props) {
  const startNote = (synth.octave + 1) * 12;
  const numOctaves = 3;
  const totalWhite = numOctaves * 7;

  const handleDown = (note: number) => synth.noteOn(note);
  const handleUp = (note: number) => synth.noteOff(note);

  const whites: { note: number; idx: number }[] = [];
  const blacks: { note: number; whiteIdx: number }[] = [];

  for (let oct = 0; oct < numOctaves; oct++) {
    for (let w = 0; w < 7; w++) {
      const note = startNote + oct * 12 + WHITE_KEYS[w];
      whites.push({ note, idx: oct * 7 + w });
    }
    for (let b = 0; b < 7; b++) {
      if (BLACK_KEYS[b] >= 0) {
        const note = startNote + oct * 12 + BLACK_KEYS[b];
        blacks.push({ note, whiteIdx: oct * 7 + b });
      }
    }
  }

  return (
    <div className="relative h-32 select-none overflow-hidden rounded-lg border border-zinc-800">
      <div className="flex h-full">
        {whites.map(({ note, idx }) => {
          const isActive = synth.activeNotes.has(note);
          return (
            <button
              key={note}
              onPointerDown={() => handleDown(note)}
              onPointerUp={() => handleUp(note)}
              onPointerLeave={() => handleUp(note)}
              className={`
                relative flex-1 border-r border-zinc-300 transition-colors flex items-end justify-center pb-1
                ${isActive ? 'bg-amber-200' : 'bg-white hover:bg-zinc-100'}
              `}
              style={{ minWidth: `${100 / totalWhite}%` }}
            >
              {idx % 7 === 0 && (
                <span className="text-[8px] text-zinc-400 font-mono">{noteName(note)}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="absolute top-0 left-0 right-0 flex pointer-events-none" style={{ height: '60%' }}>
        {whites.map(({ idx }) => {
          const black = blacks.find(b => b.whiteIdx === idx);
          if (!black) return <div key={`gap-${idx}`} className="flex-1" style={{ minWidth: `${100 / totalWhite}%` }} />;
          const isActive = synth.activeNotes.has(black.note);
          return (
            <div key={`bk-${idx}`} className="flex-1 relative" style={{ minWidth: `${100 / totalWhite}%` }}>
              <button
                onPointerDown={() => handleDown(black.note)}
                onPointerUp={() => handleUp(black.note)}
                onPointerLeave={() => handleUp(black.note)}
                className={`
                  pointer-events-auto absolute right-0 translate-x-1/2 w-[60%] h-full rounded-b-sm z-10 transition-colors
                  ${isActive ? 'bg-amber-600' : 'bg-zinc-900 hover:bg-zinc-700'}
                `}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SynthView({ synth }: Props) {
  const p = synth.preset;

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Preset</span>
        <div className="flex gap-1 flex-wrap">
          {SYNTH_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => synth.setPreset(i)}
              className={`
                px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all
                ${synth.presetIndex === i
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}
              `}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Synth Parameters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Oscillators */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Oscillators</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-[9px] text-zinc-600 mb-1">OSC 1</div>
              <div className="text-[11px] text-amber-400 font-mono font-bold">{p.osc1Wave.toUpperCase()}</div>
              <div className="text-[9px] text-zinc-600 mt-1">Gain: {(p.osc1Gain * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-zinc-600 mb-1">OSC 2</div>
              <div className="text-[11px] text-amber-400 font-mono font-bold">{p.osc2Wave.toUpperCase()}</div>
              <div className="text-[9px] text-zinc-600 mt-1">Det: {p.osc2Detune}c</div>
              <div className="text-[9px] text-zinc-600">Oct: {p.osc2Octave > 0 ? '+' : ''}{p.osc2Octave}</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Filter</h3>
          <div className="flex items-center gap-3 justify-center">
            <Knob
              value={p.filterCutoff}
              min={20} max={20000}
              label="Cutoff"
              onChange={() => {}}
              size={40}
              color="#f59e0b"
            />
            <Knob
              value={p.filterResonance}
              min={0} max={20}
              label="Res"
              onChange={() => {}}
              size={40}
              color="#f59e0b"
            />
          </div>
          <div className="text-center text-[9px] text-zinc-600 mt-2">
            Env: {p.filterEnvAmount > 0 ? '+' : ''}{p.filterEnvAmount}Hz
          </div>
        </div>

        {/* Amp Envelope */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Amp Envelope</h3>
          <div className="flex justify-between">
            {(['attack', 'decay', 'sustain', 'release'] as const).map(param => (
              <div key={param} className="text-center">
                <div className="text-[9px] text-zinc-600">{param[0].toUpperCase()}</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {param === 'sustain'
                    ? (p.ampEnvelope[param] * 100).toFixed(0) + '%'
                    : (p.ampEnvelope[param] * 1000).toFixed(0) + 'ms'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LFO */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-3">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">LFO</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[9px] text-zinc-600">Rate</div>
              <div className="text-[10px] text-amber-400 font-mono">{p.lfoRate.toFixed(1)}Hz</div>
            </div>
            <div>
              <div className="text-[9px] text-zinc-600">Depth</div>
              <div className="text-[10px] text-amber-400 font-mono">{p.lfoDepth.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-[9px] text-zinc-600">Target</div>
              <div className="text-[10px] text-amber-400 font-mono uppercase">{p.lfoTarget}</div>
            </div>
          </div>
          {p.glide > 0 && (
            <div className="text-center text-[9px] text-zinc-600 mt-2">
              Glide: {(p.glide * 1000).toFixed(0)}ms
            </div>
          )}
        </div>
      </div>

      {/* Octave selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Octave</span>
        {[1, 2, 3, 4, 5].map(oct => (
          <button
            key={oct}
            onClick={() => synth.setOctave(oct)}
            className={`
              w-7 h-7 rounded text-[11px] font-bold transition-all
              ${synth.octave === oct
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}
            `}
          >
            {oct}
          </button>
        ))}
        <span className="text-[9px] text-zinc-600 ml-2">Keys: Z-M = Notes</span>
      </div>

      {/* Piano Keyboard */}
      <PianoKeyboard synth={synth} />

      {/* Piano Roll (simplified) */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider">Piano Roll</h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-600">{synth.notes.length} notes</span>
            <button
              onClick={synth.clearNotes}
              className="text-[9px] text-zinc-500 hover:text-red-400 px-1.5 py-0.5 rounded bg-zinc-800"
            >
              Clear
            </button>
          </div>
        </div>
        <PianoRollGrid synth={synth} />
      </div>
    </div>
  );
}

function PianoRollGrid({ synth }: Props) {
  const noteRange = 24;
  const baseNote = (synth.octave + 1) * 12;
  const steps = synth.patternLength;

  const handleClick = (step: number, noteIdx: number) => {
    const note = baseNote + noteRange - 1 - noteIdx;
    const existing = synth.notes.find(n => n.startStep === step && n.note === note);
    if (existing) {
      synth.removeNote(step, note);
    } else {
      synth.addNote({ note, velocity: 0.8, startStep: step, duration: 1 });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{
        gridTemplateColumns: `32px repeat(${steps}, 1fr)`,
        gridTemplateRows: `repeat(${noteRange}, 14px)`,
        minWidth: `${steps * 28 + 32}px`,
      }}>
        {Array.from({ length: noteRange }).map((_, row) => {
          const note = baseNote + noteRange - 1 - row;
          const isBlack = [1, 3, 6, 8, 10].includes(note % 12);
          return (
            <Fragment key={`row-${row}`}>
              <div
                key={`label-${row}`}
                className={`text-[8px] font-mono flex items-center justify-end pr-1 border-b border-zinc-800/30
                  ${isBlack ? 'text-zinc-600 bg-zinc-900/80' : 'text-zinc-500'}`}
              >
                {noteName(note)}
              </div>
              {Array.from({ length: steps }).map((_, step) => {
                const hasNote = synth.notes.some(n => n.startStep === step && n.note === note);
                return (
                  <button
                    key={`${row}-${step}`}
                    onClick={() => handleClick(step, row)}
                    className={`
                      border-r border-b transition-colors
                      ${step % 4 === 0 ? 'border-r-zinc-700/50' : 'border-r-zinc-800/30'}
                      border-b-zinc-800/30
                      ${hasNote
                        ? 'bg-amber-500'
                        : isBlack
                          ? 'bg-zinc-900/60 hover:bg-zinc-800/60'
                          : 'bg-zinc-900/30 hover:bg-zinc-800/40'}
                    `}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
