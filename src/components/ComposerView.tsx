import type { ComposerState } from '../hooks/useComposer';
import { GENRE_LIST } from '../engine/Composer';
import { Play, Pause, Square, Wand2, RefreshCw, Shuffle } from 'lucide-react';

interface Props {
  composer: ComposerState;
}

function SectionBlock({ name, bars, energy, isActive, progress }: {
  name: string; bars: number; energy: number; isActive: boolean; progress: number;
}) {
  const energyColor = energy > 0.8 ? 'from-amber-500 to-orange-500'
    : energy > 0.5 ? 'from-amber-600/60 to-amber-500/60'
    : energy > 0.3 ? 'from-zinc-600/40 to-zinc-500/40'
    : 'from-zinc-700/30 to-zinc-600/30';

  return (
    <div
      className={`relative flex-shrink-0 rounded-lg border overflow-hidden transition-all ${
        isActive
          ? 'border-amber-400 shadow-lg shadow-amber-500/20'
          : 'border-zinc-800/50'
      }`}
      style={{ width: `${bars * 28}px`, minWidth: '60px' }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-t ${energyColor} opacity-80`}
        style={{ height: `${energy * 100}%`, top: 'auto', bottom: 0 }}
      />
      {isActive && progress > 0 && (
        <div className="absolute inset-y-0 left-0 bg-white/10" style={{ width: `${progress * 100}%` }} />
      )}
      <div className="relative p-1.5 text-center">
        <div className={`text-[8px] font-bold tracking-wider ${isActive ? 'text-amber-300' : 'text-zinc-500'}`}>
          {name}
        </div>
        <div className="text-[7px] text-zinc-600">{bars} bars</div>
      </div>
    </div>
  );
}

function GenreSelector({ composer }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
      <button
        onClick={() => composer.setSelectedGenre(null)}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all flex items-center gap-1 ${
          composer.selectedGenre === null
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
            : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Shuffle size={10} />
        RANDOM
      </button>
      {GENRE_LIST.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => composer.setSelectedGenre(id)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
            composer.selectedGenre === id
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {label.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function SongInfo({ composer }: Props) {
  const { song } = composer;
  if (!song) return null;

  const genreLabel = GENRE_LIST.find(g => g.id === song.genre)?.label ?? song.genre;
  const hasVocals = song.sections.some(s => s.vocalEvents.length > 0);
  const hasArp = song.sections.some(s => s.arpNotes.length > 0);

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">{song.title}</h2>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="font-mono">{song.bpm} BPM</span>
            <span>·</span>
            <span className="uppercase tracking-wider">{song.key}</span>
            <span>·</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">{genreLabel}</span>
            <span>·</span>
            <span>{song.sections.length} sections</span>
            <span>·</span>
            <span>{song.sections.reduce((s, sec) => s + sec.bars, 0)} bars</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] flex-wrap justify-end">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-500">DRUMS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-500">BASS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-zinc-500">CHORDS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-zinc-500">LEAD</span>
          </div>
          {hasArp && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-zinc-500">ARP</span>
            </div>
          )}
          {hasVocals && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-zinc-500">VOCAL</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {song.sections.map((section, i) => {
          const sectionSteps = section.bars * 16;
          const progress = composer.sectionIndex === i
            ? composer.sectionStep / sectionSteps
            : composer.sectionIndex > i ? 1 : 0;
          return (
            <SectionBlock
              key={i}
              name={section.name}
              bars={section.bars}
              energy={section.energy}
              isActive={composer.sectionIndex === i && composer.playing}
              progress={progress}
            />
          );
        })}
      </div>

      <div className="mt-3">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100"
            style={{ width: composer.totalSteps > 0 ? `${(composer.totalStep / composer.totalSteps) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-zinc-600 font-mono">
          <span>{composer.sectionName || 'Ready'}</span>
          <span>{Math.floor(composer.totalStep / 16)} / {Math.floor(composer.totalSteps / 16)} bars</span>
        </div>
      </div>
    </div>
  );
}

interface LaneProps {
  label: string;
  color: string;
  steps: { step: number; duration: number }[];
  viewStart: number;
  viewEnd: number;
  visibleSteps: number;
  stepWidth: number;
  currentStep: number;
  playing: boolean;
}

function TrackLane({ label, color, steps, viewStart, viewEnd, visibleSteps, stepWidth, currentStep, playing }: LaneProps) {
  return (
    <div className="relative h-6 bg-zinc-950 rounded overflow-hidden">
      <span className={`absolute left-1 top-0.5 text-[7px] font-bold z-10 ${color}`}>{label}</span>
      {steps.map((note, i) => {
        if (note.step < viewStart || note.step >= viewEnd) return null;
        return (
          <div
            key={i}
            className={`absolute top-1 bottom-1 rounded-sm ${color.replace('/60', '/50').replace('text-', 'bg-')}`}
            style={{
              left: `${((note.step - viewStart) / visibleSteps) * 100}%`,
              width: `${Math.max((note.duration / visibleSteps) * 100, stepWidth * 0.8)}%`,
            }}
          />
        );
      })}
      {playing && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
          style={{ left: `${((currentStep - viewStart) / visibleSteps) * 100}%` }}
        />
      )}
    </div>
  );
}

function TrackLanes({ composer }: Props) {
  const { song, sectionIndex, sectionStep, playing } = composer;
  if (!song) return null;

  const section = song.sections[sectionIndex];
  if (!section) return null;
  const totalSteps = section.bars * 16;
  const visibleSteps = Math.min(totalSteps, 64);
  const viewStart = Math.max(0, sectionStep - 8);
  const viewEnd = Math.min(totalSteps, viewStart + visibleSteps);
  const stepWidth = 100 / visibleSteps;

  const hasArp = section.arpNotes.length > 0;
  const hasVocals = section.vocalEvents.length > 0;
  const hasFx = section.fxRiser;

  // Drum hits as step/duration events
  const drumSteps: { step: number; duration: number }[] = [];
  for (let step = viewStart; step < viewEnd; step++) {
    for (let pad = 0; pad < Math.min(16, section.drumPattern.length); pad++) {
      if (step < section.drumPattern[pad].length && section.drumPattern[pad][step].active) {
        drumSteps.push({ step, duration: 1 });
        break;
      }
    }
  }

  const common = { viewStart, viewEnd, visibleSteps, stepWidth, currentStep: sectionStep, playing };

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-3 space-y-1.5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider">
          Live View — {section.name}
        </h3>
        <span className="text-[9px] text-zinc-600 font-mono">
          Step {sectionStep + 1} / {totalSteps}
        </span>
      </div>

      <TrackLane label="DRUMS" color="text-amber-500/60" steps={drumSteps} {...common} />
      <TrackLane label="BASS" color="text-blue-500/60" steps={section.bassNotes} {...common} />
      <TrackLane label="CHORDS" color="text-purple-500/60"
        steps={section.chordNotes.map(c => ({ step: c.step, duration: c.duration }))} {...common} />
      <TrackLane label="LEAD" color="text-green-500/60" steps={section.leadNotes} {...common} />
      {hasArp && <TrackLane label="ARP" color="text-cyan-400/60" steps={section.arpNotes} {...common} />}
      {hasVocals && (
        <TrackLane label="VOCAL" color="text-pink-500/60"
          steps={section.vocalEvents.map(v => ({ step: v.step, duration: v.duration }))} {...common} />
      )}
      {hasFx && (
        <div className="relative h-4 bg-zinc-950 rounded overflow-hidden">
          <span className="absolute left-1 top-0 text-[7px] text-orange-400/60 font-bold z-10">FX RISER</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/15 to-orange-500/30 rounded" />
          {playing && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
              style={{ left: `${((sectionStep - viewStart) / visibleSteps) * 100}%` }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ComposerView({ composer }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <Wand2 size={20} className="text-amber-400" />
          <h2 className="text-xl font-black tracking-tight text-white">AI COMPOSER</h2>
          <Wand2 size={20} className="text-amber-400" />
        </div>
        <p className="text-[11px] text-zinc-500 mb-4 max-w-lg mx-auto">
          Mozart meets Fred Again — algorithmic composition with genre-aware drums, bass, chords,
          melody, arpeggios, vocal synthesis, and FX. 12 scales, 8 genres, every song unique.
        </p>

        <GenreSelector composer={composer} />

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={composer.generate}
            disabled={composer.generating}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
              ${composer.generating
                ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25'}
            `}
          >
            {composer.generating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Composing...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                {composer.song ? 'Generate New Song' : 'Generate Song'}
              </>
            )}
          </button>

          {composer.song && (
            <div className="flex items-center gap-1">
              <button
                onClick={composer.stop}
                className="p-2.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Square size={16} />
              </button>
              <button
                onClick={() => composer.playing ? composer.pause() : composer.play()}
                className={`p-3 rounded-xl transition-all ${
                  composer.playing
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-700 text-white hover:bg-zinc-600'
                }`}
              >
                {composer.playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {composer.song && <SongInfo composer={composer} />}
      {composer.song && <TrackLanes composer={composer} />}

      {!composer.song && (
        <div className="text-center py-10 text-zinc-700">
          <div className="text-3xl mb-3 font-mono">{'{ }'}</div>
          <p className="text-[11px]">Select a genre or leave on Random, then click "Generate Song"</p>
        </div>
      )}
    </div>
  );
}
