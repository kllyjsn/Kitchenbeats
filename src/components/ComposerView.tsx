import type { ComposerState } from '../hooks/useComposer';
import { Play, Pause, Square, Wand2, RefreshCw } from 'lucide-react';

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
      {/* Energy fill */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${energyColor} opacity-80`}
        style={{ height: `${energy * 100}%`, top: 'auto', bottom: 0 }}
      />

      {/* Progress overlay */}
      {isActive && progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-white/10"
          style={{ width: `${progress * 100}%` }}
        />
      )}

      {/* Label */}
      <div className="relative p-1.5 text-center">
        <div className={`text-[8px] font-bold tracking-wider ${
          isActive ? 'text-amber-300' : 'text-zinc-500'
        }`}>
          {name}
        </div>
        <div className="text-[7px] text-zinc-600">{bars} bars</div>
      </div>
    </div>
  );
}

function SongInfo({ composer }: Props) {
  const { song } = composer;
  if (!song) return null;

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
            <span>{song.sections.length} sections</span>
            <span>·</span>
            <span>{song.sections.reduce((s, sec) => s + sec.bars, 0)} bars</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
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
        </div>
      </div>

      {/* Arrangement timeline */}
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

      {/* Progress bar */}
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

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider">
          Live View — {section.name}
        </h3>
        <span className="text-[9px] text-zinc-600 font-mono">
          Step {sectionStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Drum lane */}
      <div className="relative h-6 bg-zinc-950 rounded overflow-hidden">
        <span className="absolute left-1 top-0.5 text-[7px] text-amber-500/60 font-bold z-10">DRUMS</span>
        {Array.from({ length: viewEnd - viewStart }).map((_, i) => {
          const step = viewStart + i;
          let hasHit = false;
          for (let pad = 0; pad < Math.min(16, section.drumPattern.length); pad++) {
            if (step < section.drumPattern[pad].length && section.drumPattern[pad][step].active) {
              hasHit = true; break;
            }
          }
          return hasHit ? (
            <div
              key={i}
              className="absolute top-1 bottom-1 bg-amber-500/60 rounded-sm"
              style={{ left: `${i * stepWidth}%`, width: `${Math.max(stepWidth * 0.8, 1)}%` }}
            />
          ) : null;
        })}
        {playing && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
            style={{ left: `${((sectionStep - viewStart) / visibleSteps) * 100}%` }}
          />
        )}
      </div>

      {/* Bass lane */}
      <div className="relative h-6 bg-zinc-950 rounded overflow-hidden">
        <span className="absolute left-1 top-0.5 text-[7px] text-blue-500/60 font-bold z-10">BASS</span>
        {section.bassNotes.map((note, i) => {
          if (note.step < viewStart || note.step >= viewEnd) return null;
          return (
            <div
              key={i}
              className="absolute top-1 bottom-1 bg-blue-500/60 rounded-sm"
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
            style={{ left: `${((sectionStep - viewStart) / visibleSteps) * 100}%` }}
          />
        )}
      </div>

      {/* Chord lane */}
      <div className="relative h-6 bg-zinc-950 rounded overflow-hidden">
        <span className="absolute left-1 top-0.5 text-[7px] text-purple-500/60 font-bold z-10">CHORDS</span>
        {section.chordNotes.map((chord, i) => {
          if (chord.step < viewStart || chord.step >= viewEnd) return null;
          return (
            <div
              key={i}
              className="absolute top-1 bottom-1 bg-purple-500/40 rounded-sm"
              style={{
                left: `${((chord.step - viewStart) / visibleSteps) * 100}%`,
                width: `${Math.max((chord.duration / visibleSteps) * 100, stepWidth * 0.8)}%`,
              }}
            />
          );
        })}
        {playing && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
            style={{ left: `${((sectionStep - viewStart) / visibleSteps) * 100}%` }}
          />
        )}
      </div>

      {/* Lead lane */}
      <div className="relative h-6 bg-zinc-950 rounded overflow-hidden">
        <span className="absolute left-1 top-0.5 text-[7px] text-green-500/60 font-bold z-10">LEAD</span>
        {section.leadNotes.map((note, i) => {
          if (note.step < viewStart || note.step >= viewEnd) return null;
          return (
            <div
              key={i}
              className="absolute top-1 bottom-1 bg-green-500/50 rounded-sm"
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
            style={{ left: `${((sectionStep - viewStart) / visibleSteps) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function ComposerView({ composer }: Props) {
  return (
    <div className="space-y-4">
      {/* Hero / Generate */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <Wand2 size={20} className="text-amber-400" />
          <h2 className="text-xl font-black tracking-tight text-white">AI COMPOSER</h2>
          <Wand2 size={20} className="text-amber-400" />
        </div>
        <p className="text-[11px] text-zinc-500 mb-5 max-w-md mx-auto">
          Mozart meets Fred Again — algorithmic composition engine generating full songs
          with drums, bass, chords, and melody. Every song is unique.
        </p>

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

      {/* Song Info + Arrangement */}
      {composer.song && <SongInfo composer={composer} />}

      {/* Track Lanes */}
      {composer.song && <TrackLanes composer={composer} />}

      {/* Empty state */}
      {!composer.song && (
        <div className="text-center py-12 text-zinc-700">
          <div className="text-4xl mb-3">
            <span role="img" aria-label="music">
              {'{ }'}
            </span>
          </div>
          <p className="text-[11px]">Click "Generate Song" to compose your first track</p>
        </div>
      )}
    </div>
  );
}
