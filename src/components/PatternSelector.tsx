import type { Pattern } from '../types';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface PatternSelectorProps {
  patterns: Pattern[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onCopy: (from: number, to: number) => void;
}

export function PatternSelector({ patterns, currentIndex, onSelect, onCopy }: PatternSelectorProps) {
  const [copyFrom, setCopyFrom] = useState<number | null>(null);

  const handleCopyClick = () => {
    if (copyFrom === null) {
      setCopyFrom(currentIndex);
    } else {
      if (copyFrom !== currentIndex) {
        onCopy(copyFrom, currentIndex);
      }
      setCopyFrom(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest mr-1 font-semibold">Pattern</span>
      {patterns.map((_, i) => {
        const hasNotes = patterns[i].steps.some(padSteps =>
          padSteps.some(s => s.active)
        );
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`
              w-7 h-6 rounded text-[10px] font-mono font-bold transition-all relative
              ${currentIndex === i
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-700'}
              ${copyFrom === i ? 'ring-1 ring-blue-400' : ''}
            `}
          >
            {i + 1}
            {hasNotes && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
      <button
        onClick={handleCopyClick}
        className={`
          ml-1 w-6 h-6 rounded flex items-center justify-center transition-all
          ${copyFrom !== null
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-transparent'}
        `}
        title={copyFrom !== null ? 'Click target pattern to paste' : 'Copy pattern'}
      >
        <Copy size={11} />
      </button>
    </div>
  );
}
