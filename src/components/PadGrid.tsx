import { Pad } from './Pad';
import type { PadConfig, PadBank } from '../types';
import { KEYBOARD_MAP } from '../types';

interface PadGridProps {
  pads: PadConfig[];
  activePads: Set<number>;
  selectedPad: number;
  currentBank: PadBank;
  onTrigger: (index: number, velocity: number) => void;
  onSelect: (index: number) => void;
  onBankChange: (bank: PadBank) => void;
}

const BANKS: PadBank[] = ['A', 'B', 'C', 'D'];
const BANK_COLORS: Record<PadBank, string> = {
  A: '#ff3b30',
  B: '#ff9500',
  C: '#34c759',
  D: '#007aff',
};

const shortcutMap: Record<number, string> = {};
for (const [key, idx] of Object.entries(KEYBOARD_MAP)) {
  shortcutMap[idx] = key.toUpperCase();
}

export function PadGrid({
  pads, activePads, selectedPad, currentBank,
  onTrigger, onSelect, onBankChange,
}: PadGridProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Bank selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest mr-2 font-semibold">Bank</span>
        {BANKS.map(bank => (
          <button
            key={bank}
            onClick={() => onBankChange(bank)}
            className={`
              w-8 h-7 rounded text-xs font-bold transition-all
              ${currentBank === bank
                ? 'text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/50'}
            `}
            style={{
              background: currentBank === bank ? `${BANK_COLORS[bank]}30` : undefined,
              borderBottom: currentBank === bank ? `2px solid ${BANK_COLORS[bank]}` : '2px solid transparent',
            }}
          >
            {bank}
          </button>
        ))}
      </div>

      {/* Pad grid */}
      <div className="grid grid-cols-4 gap-2">
        {pads.map((pad, i) => (
          <Pad
            key={i}
            index={i}
            name={pad.name}
            color={pad.color}
            isActive={activePads.has(i)}
            isSelected={selectedPad === i}
            isMuted={pad.muted}
            isSoloed={pad.soloed}
            shortcut={shortcutMap[i] ?? ''}
            onTrigger={onTrigger}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
