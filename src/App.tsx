import { useState } from 'react';
import { useMPC } from './hooks/useMPC';
import { useSynth } from './hooks/useSynth';
import { useDJ } from './hooks/useDJ';
import { useKeyboard } from './hooks/useKeyboard';
import { Display } from './components/Display';
import { Transport } from './components/Transport';
import { PadGrid } from './components/PadGrid';
import { StepSequencer } from './components/StepSequencer';
import { Mixer } from './components/Mixer';
import { EffectsPanel } from './components/EffectsPanel';
import { PatternSelector } from './components/PatternSelector';
import { Visualizer } from './components/Visualizer';
import { SynthView } from './components/SynthView';
import { DJView } from './components/DJView';
import type { AppMode, ViewMode } from './types';
import { Grid3X3, ListMusic, Sliders, Sparkles, Disc, Music, Drum } from 'lucide-react';
import './index.css';

const VIEW_TABS: { mode: ViewMode; label: string; icon: typeof Grid3X3 }[] = [
  { mode: 'pads', label: 'Pads', icon: Grid3X3 },
  { mode: 'sequencer', label: 'Sequence', icon: ListMusic },
  { mode: 'mixer', label: 'Mixer', icon: Sliders },
  { mode: 'effects', label: 'FX', icon: Sparkles },
];

const APP_MODES: { mode: AppMode; label: string; icon: typeof Grid3X3 }[] = [
  { mode: 'studio', label: 'STUDIO', icon: Drum },
  { mode: 'keys', label: 'KEYS', icon: Music },
  { mode: 'dj', label: 'DJ', icon: Disc },
];

function App() {
  const [appMode, setAppMode] = useState<AppMode>('studio');
  const mpc = useMPC();
  const synth = useSynth();
  const dj = useDJ();

  useKeyboard({
    onTriggerPad: appMode === 'studio' ? mpc.triggerPad : undefined,
    onTogglePlay: appMode === 'studio' ? mpc.togglePlay : undefined,
    onToggleRecord: appMode === 'studio' ? mpc.toggleRecord : undefined,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">KB</span>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight leading-none">KITCHEN BEATS</h1>
                <span className="text-[9px] text-zinc-500 tracking-widest uppercase">Music Production Platform</span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-900/80 rounded-lg p-0.5">
              {APP_MODES.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setAppMode(mode)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all
                    ${appMode === mode
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'}
                  `}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            {appMode === 'studio' && (
              <>
                <span className="hidden sm:inline">SPACE=Play</span>
                <span className="hidden sm:inline text-zinc-800">|</span>
                <span className="hidden sm:inline">1-4/Q-R/A-F/Z-V=Pads</span>
              </>
            )}
            {appMode === 'keys' && (
              <span className="hidden sm:inline">Z-M=Notes · Oct 1-5</span>
            )}
            {appMode === 'dj' && (
              <span className="hidden sm:inline">Drop audio files to load</span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col gap-4">
        {/* ── STUDIO MODE ── */}
        {appMode === 'studio' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Display
                bpm={mpc.bpm}
                currentStep={mpc.currentStep}
                playing={mpc.playing}
                recording={mpc.recording}
                patternName={mpc.currentPattern.name}
                selectedPad={mpc.pads[mpc.selectedPad]}
                bank={mpc.currentBank}
              />
              <Visualizer getEngine={mpc.getEngine} playing={mpc.playing} />
            </div>

            <Transport
              bpm={mpc.bpm}
              playing={mpc.playing}
              recording={mpc.recording}
              onBpmChange={mpc.setBpm}
              onTogglePlay={mpc.togglePlay}
              onToggleRecord={mpc.toggleRecord}
              onExport={mpc.exportWav}
              onClear={mpc.clearPattern}
              swing={mpc.currentPattern.swing}
              onSwingChange={mpc.setSwing}
              stepLength={mpc.stepLength}
              onStepLengthChange={mpc.setPatternLength}
            />

            <PatternSelector
              patterns={mpc.patterns}
              currentIndex={mpc.currentPatternIdx}
              onSelect={mpc.setCurrentPatternIdx}
              onCopy={mpc.copyPattern}
            />

            <div className="flex items-center gap-1 border-b border-zinc-800/50 pb-0">
              {VIEW_TABS.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => mpc.setViewMode(mode)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all
                    border-b-2 -mb-[1px]
                    ${mpc.viewMode === mode
                      ? 'text-amber-400 border-amber-500'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'}
                  `}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0">
              {mpc.viewMode === 'pads' && (
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="lg:w-[320px] flex-shrink-0">
                    <PadGrid
                      pads={mpc.pads}
                      activePads={mpc.activePads}
                      selectedPad={mpc.selectedPad}
                      currentBank={mpc.currentBank}
                      onTrigger={mpc.triggerPad}
                      onSelect={mpc.setSelectedPad}
                      onBankChange={mpc.setCurrentBank}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <StepSequencer
                      pattern={mpc.currentPattern}
                      pads={mpc.pads}
                      currentStep={mpc.currentStep}
                      selectedPad={mpc.selectedPad}
                      onToggleStep={mpc.toggleStep}
                      onStepVelocity={mpc.setStepVelocity}
                      onSelectPad={mpc.setSelectedPad}
                    />
                  </div>
                </div>
              )}

              {mpc.viewMode === 'sequencer' && (
                <StepSequencer
                  pattern={mpc.currentPattern}
                  pads={mpc.pads}
                  currentStep={mpc.currentStep}
                  selectedPad={mpc.selectedPad}
                  onToggleStep={mpc.toggleStep}
                  onStepVelocity={mpc.setStepVelocity}
                  onSelectPad={mpc.setSelectedPad}
                />
              )}

              {mpc.viewMode === 'mixer' && (
                <Mixer
                  pads={mpc.pads}
                  selectedPad={mpc.selectedPad}
                  onUpdatePad={mpc.updatePad}
                  onSelectPad={mpc.setSelectedPad}
                />
              )}

              {mpc.viewMode === 'effects' && (
                <EffectsPanel
                  effects={mpc.masterEffects}
                  onUpdate={mpc.updateMasterEffect}
                />
              )}
            </div>
          </>
        )}

        {/* ── KEYS MODE ── */}
        {appMode === 'keys' && <SynthView synth={synth} />}

        {/* ── DJ MODE ── */}
        {appMode === 'dj' && <DJView dj={dj} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[10px] text-zinc-600">
          <span>Kitchen Beats v2.0</span>
          <div className="flex items-center gap-3">
            <span>Studio</span>
            <span>·</span>
            <span>Synth</span>
            <span>·</span>
            <span>DJ</span>
          </div>
          <span>Web Audio API</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
