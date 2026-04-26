import { useCallback, useRef } from 'react';

interface PadProps {
  index: number;
  name: string;
  color: string;
  isActive: boolean;
  isSelected: boolean;
  isMuted: boolean;
  isSoloed: boolean;
  shortcut: string;
  onTrigger: (index: number, velocity: number) => void;
  onSelect: (index: number) => void;
}

export function Pad({
  index, name, color, isActive, isSelected,
  isMuted, isSoloed, shortcut,
  onTrigger, onSelect,
}: PadProps) {
  const padRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = (e.clientY - rect.top) / rect.height;
    const velocity = Math.max(0.2, Math.min(1, 1 - y * 0.5));
    onTrigger(index, velocity);
  }, [index, onTrigger]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(index);
  }, [index, onSelect]);

  return (
    <button
      ref={padRef}
      className={`
        relative aspect-square rounded-lg transition-all duration-75
        border-2 overflow-hidden group cursor-pointer
        ${isSelected ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-black' : ''}
        ${isMuted ? 'opacity-40' : ''}
        active:scale-[0.96]
      `}
      style={{
        borderColor: isActive ? color : `${color}40`,
        background: isActive
          ? `radial-gradient(circle at center, ${color}50, ${color}15)`
          : `linear-gradient(135deg, ${color}12, ${color}06)`,
        boxShadow: isActive
          ? `0 0 20px ${color}40, inset 0 0 15px ${color}20`
          : `inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onClick={() => onSelect(index)}
    >
      {/* Velocity flash overlay */}
      <div
        className="absolute inset-0 rounded-lg transition-opacity duration-100"
        style={{
          background: `radial-gradient(circle at center, ${color}80, transparent)`,
          opacity: isActive ? 1 : 0,
        }}
      />

      {/* Pad label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-[10px] font-bold text-white/90 tracking-wide">{name}</span>
        <span className="text-[8px] text-white/40 font-mono uppercase">{shortcut}</span>
      </div>

      {/* Status indicators */}
      <div className="absolute top-1 right-1 flex gap-0.5">
        {isSoloed && (
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        )}
        {isMuted && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        )}
      </div>

      {/* Bottom edge glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: isActive ? color : `${color}30` }}
      />
    </button>
  );
}
