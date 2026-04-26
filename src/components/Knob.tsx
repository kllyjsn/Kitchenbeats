import { useCallback, useRef } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  unit?: string;
  step?: number;
  bipolar?: boolean;
}

export function Knob({
  value, min, max, label, onChange,
  size = 48, color = '#ff9500', unit = '', step,
  bipolar = false,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);

  const normalizedValue = (value - min) / (max - min);
  const angle = -135 + normalizedValue * 270;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startVal: value };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = (dragRef.current.startY - ev.clientY) / 120;
      let newVal = dragRef.current.startVal + delta * (max - min);
      if (step) newVal = Math.round(newVal / step) * step;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    };

    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [value, min, max, onChange, step]);

  const handleDoubleClick = useCallback(() => {
    onChange(bipolar ? 0 : min);
  }, [bipolar, min, onChange]);

  const displayValue = (() => {
    if (unit === 'Hz' && value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    if (unit === 'dB') return `${value.toFixed(0)}`;
    if (unit === '%') return `${Math.round(value * 100)}`;
    if (unit === 'st') return `${value > 0 ? '+' : ''}${value.toFixed(0)}`;
    if (step && step >= 1) return `${Math.round(value)}`;
    return `${value.toFixed(2)}`;
  })();

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        ref={knobRef}
        className="relative cursor-grab active:cursor-grabbing"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <svg viewBox="0 0 48 48" width={size} height={size}>
          {/* Track */}
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="3"
            strokeDasharray="85 170"
            strokeDashoffset="-127.5"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${normalizedValue * 85} 170`}
            strokeDashoffset="-127.5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${color}40)` }}
          />
          {/* Knob body */}
          <circle cx="24" cy="24" r="14"
            fill="url(#knobGrad)"
            stroke="#444"
            strokeWidth="1"
          />
          {/* Indicator */}
          <line
            x1="24" y1="24" x2="24" y2="12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle}, 24, 24)`}
          />
          <defs>
            <radialGradient id="knobGrad" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#555" />
              <stop offset="100%" stopColor="#222" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-[10px] text-zinc-300 font-mono tabular-nums">
        {displayValue}{unit === 'Hz' ? '' : unit === '%' ? '%' : unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
}
