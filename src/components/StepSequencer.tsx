import type { Pattern, PadConfig } from '../types';

interface StepSequencerProps {
  pattern: Pattern;
  pads: PadConfig[];
  currentStep: number;
  selectedPad: number;
  onToggleStep: (padIndex: number, stepIndex: number) => void;
  onStepVelocity: (padIndex: number, stepIndex: number, velocity: number) => void;
  onSelectPad: (index: number) => void;
}

export function StepSequencer({
  pattern, pads, currentStep, selectedPad,
  onToggleStep, onStepVelocity, onSelectPad,
}: StepSequencerProps) {
  return (
    <div className="flex flex-col gap-0.5 overflow-x-auto scrollbar-thin">
      {/* Step numbers header */}
      <div className="flex gap-0.5 pl-[72px]">
        {Array.from({ length: pattern.length }, (_, i) => (
          <div
            key={i}
            className={`
              w-7 min-w-[28px] h-4 flex items-center justify-center text-[8px] font-mono
              ${currentStep === i ? 'text-amber-400 font-bold' : 'text-zinc-600'}
              ${i % 4 === 0 ? 'text-zinc-400' : ''}
            `}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Pad rows */}
      {pads.map((pad, padIdx) => (
        <div key={padIdx} className="flex items-center gap-0.5">
          {/* Pad label */}
          <button
            onClick={() => onSelectPad(padIdx)}
            className={`
              w-[68px] min-w-[68px] h-7 rounded text-[10px] font-bold
              flex items-center px-2 gap-1 transition-all truncate
              ${selectedPad === padIdx
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}
            `}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: pad.color }}
            />
            <span className="truncate">{pad.name}</span>
          </button>

          {/* Steps */}
          {Array.from({ length: pattern.length }, (_, stepIdx) => {
            const step = pattern.steps[padIdx]?.[stepIdx];
            const isActive = step?.active ?? false;
            const velocity = step?.velocity ?? 0.8;
            const isCurrentStep = currentStep === stepIdx;
            const isBeat = stepIdx % 4 === 0;

            return (
              <button
                key={stepIdx}
                className={`
                  w-7 min-w-[28px] h-7 rounded-sm transition-all relative
                  ${isActive
                    ? 'border border-transparent'
                    : isBeat
                      ? 'bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-700/50'
                      : 'bg-zinc-850 border border-zinc-800/30 hover:bg-zinc-800/50'}
                  ${isCurrentStep ? 'ring-1 ring-amber-500/60' : ''}
                `}
                style={{
                  background: isActive
                    ? `${pad.color}${Math.round(velocity * 200 + 55).toString(16).padStart(2, '0')}`
                    : undefined,
                  boxShadow: isActive && isCurrentStep
                    ? `0 0 8px ${pad.color}60`
                    : undefined,
                }}
                onClick={() => onToggleStep(padIdx, stepIdx)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isActive) {
                    const newVel = velocity <= 0.3 ? 1.0 : velocity - 0.25;
                    onStepVelocity(padIdx, stepIdx, Math.max(0.1, newVel));
                  }
                }}
              >
                {/* Velocity indicator */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-b-sm"
                    style={{
                      height: `${velocity * 100}%`,
                      background: `${pad.color}40`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Playhead */}
      <div className="flex gap-0.5 pl-[72px] mt-0.5">
        {Array.from({ length: pattern.length }, (_, i) => (
          <div
            key={i}
            className="w-7 min-w-[28px] h-1 rounded-full transition-all"
            style={{
              background: currentStep === i ? '#f59e0b' : 'transparent',
              boxShadow: currentStep === i ? '0 0 6px #f59e0b80' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
