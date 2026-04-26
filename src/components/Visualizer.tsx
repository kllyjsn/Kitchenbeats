import { useEffect, useRef, useCallback } from 'react';
import type { AudioEngine } from '../engine/AudioEngine';

interface VisualizerProps {
  getEngine: () => AudioEngine;
  playing: boolean;
}

export function Visualizer({ getEngine, playing }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = getEngine();
    const freqData = engine.getAnalyserData();
    const waveData = engine.getWaveformData();

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Frequency bars
    const barCount = 64;
    const binSize = Math.floor(freqData.length / barCount);
    const barWidth = w / barCount - 1;

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += freqData[i * binSize + j];
      }
      const avg = sum / binSize;
      const barHeight = (avg / 255) * h * 0.8;

      const hue = (i / barCount) * 30 + 15;
      const alpha = 0.4 + (avg / 255) * 0.6;

      ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${alpha})`;
      const x = i * (barWidth + 1);
      ctx.fillRect(x, h - barHeight, barWidth, barHeight);

      // Glow effect for high-energy bars
      if (avg > 150) {
        ctx.shadowColor = `hsl(${hue}, 90%, 55%)`;
        ctx.shadowBlur = 8;
        ctx.fillRect(x, h - barHeight, barWidth, 2);
        ctx.shadowBlur = 0;
      }
    }

    // Waveform line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 149, 0, 0.5)';
    ctx.lineWidth = 1.5;
    const sliceWidth = w / waveData.length;
    let x = 0;
    for (let i = 0; i < waveData.length; i++) {
      const v = waveData[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();

    animRef.current = requestAnimationFrame(draw);
  }, [getEngine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    });
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw, playing]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 rounded-lg bg-black/40 border border-zinc-800/50"
      style={{ imageRendering: 'auto' }}
    />
  );
}
