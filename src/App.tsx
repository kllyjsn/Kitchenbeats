import { useMPC } from './hooks/useMPC';
import { useKeyboard } from './hooks/useKeyboard';
import { Display } from './components/Display';
import { Transport } from './components/Transport';
import { PadGrid } from './components/PadGrid';
import { StepSequencer } from './components/StepSequencer';
import { Mixer } from './components/Mixer';
import { EffectsPanel } from './components/EffectsPanel';
import { PatternSelector } from './components/PatternSelector';
import { Visualizer } from './components/Visualizer';
import type { ViewMode } from './types';
import { Grid3X3, ListMusic, Sliders, Sparkles } from 'lucide-react';
import './index.css';

const VIEW_TABS: { mode: ViewMode; label: string; icon: typeof Grid3X3 }[] = [
  { mode: 'pads', label: 'Pads', icon: Grid3X3 },
  { mode: 'sequencer', label: 'Sequence', icon: ListMusic },
  { mode: 'mixer', label: 'Mixer', icon: Sliders },
  { mode: 'effects', label: 'FX', icon: Sparkles },
];

function App() {
  const mpc = useMPC();

  useKeyboard({
    onTriggerPad: mpc.triggerPad,
    onTogglePlay: mpc.togglePlay,
    onToggleRecord: mpc.toggleRecord,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">KB</span>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight leading-none">KITCHEN BEATS</h1>
                <span className="text-[9px] text-zinc-500 tracking-widest uppercase">Digital Production Center</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <span className="hidden sm:inline">SPACE=Play</span>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <span className="hidden sm:inline">ENTER=Rec</span>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <span className="hidden sm:inline">1-4/Q-R/A-F/Z-V=Pads</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Display + Visualizer */}
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

        {/* Transport */}
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

        {/* Pattern Selector */}
        <PatternSelector
          patterns={mpc.patterns}
          currentIndex={mpc.currentPatternIdx}
          onSelect={mpc.setCurrentPatternIdx}
          onCopy={mpc.copyPattern}
        />

        {/* View tabs */}
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

        {/* Active view */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[10px] text-zinc-600">
          <span>Kitchen Beats v1.0</span>
          <span>Web Audio API</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
