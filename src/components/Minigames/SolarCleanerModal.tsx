import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface SolarCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDust: number;
  onFinishCleaning: (cleanedDust: number) => void;
}

export const SolarCleanerModal: React.FC<SolarCleanerModalProps> = ({
  isOpen,
  onClose,
  currentDust,
  onFinishCleaning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dustCoverage, setDustCoverage] = useState(75);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const initialDust = Math.min(100, Math.max(25, Math.round(currentDust + 40)));
    setDustCoverage(initialDust);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 460;
    canvas.height = 240;

    // Draw solar panel cells underneath
    ctx.fillStyle = '#080F1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines for solar cells
    ctx.strokeStyle = '#4DD0E1';
    ctx.lineWidth = 1.5;
    const cols = 8;
    const rows = 4;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        ctx.strokeRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
      }
    }

    // Save solar background as image data
    const bgImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Now draw red dust layer over it
    ctx.fillStyle = 'rgba(211, 84, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dust particle specks
    ctx.fillStyle = 'rgba(158, 42, 27, 0.9)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      ctx.fillRect(rx, ry, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }

    const cleanAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Erase dust
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      setDustCoverage((prev) => Math.max(0, prev - 0.7));
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDrawingRef.current = true;
      cleanAt(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDrawingRef.current) cleanAt(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      isDrawingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDrawingRef.current = true;
      if (e.touches[0]) cleanAt(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDrawingRef.current && e.touches[0]) {
        cleanAt(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, currentDust]);

  if (!isOpen) return null;

  const solarEfficiency = Math.round(100 - dustCoverage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-xl w-full glass-panel rounded-2xl p-6 border-2 border-[#E67E22] space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#E67E22]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#E67E22]">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              SOLAR PANEL DUST REMOVAL
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#F4F7FA]/70">
          Drag your cursor or swipe your finger back and forth across the solar panel cells to sweep accumulated Martian red dust.
        </p>

        <div className="relative w-full h-60 bg-[#080F1E] rounded-xl overflow-hidden border border-[#4DD0E1]/40 cursor-crosshair">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="glass-panel p-2.5 rounded-xl border border-white/10">
            <span className="text-[#F4F7FA]/60 block text-[10px] font-orbitron">DUST COVERAGE</span>
            <span className="font-orbitron font-black text-sm text-[#FF5722]">
              {Math.round(dustCoverage)}%
            </span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl border border-white/10">
            <span className="text-[#F4F7FA]/60 block text-[10px] font-orbitron">EFFICIENCY</span>
            <span className="font-orbitron font-black text-sm text-[#2ECC71]">
              {solarEfficiency}%
            </span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl border border-white/10">
            <span className="text-[#F4F7FA]/60 block text-[10px] font-orbitron">STATUS</span>
            <span className="font-orbitron font-bold text-xs text-white">
              {dustCoverage < 15 ? 'CLEANED ✓' : 'SWIPING...'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onFinishCleaning(dustCoverage)}
          className="w-full py-3 rounded-xl font-orbitron font-bold text-sm bg-[#2ECC71] text-black hover:bg-[#4DD0E1] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>CONFIRM CLEANING & RESTORE SOLAR EFFICIENCY</span>
        </button>
      </div>
    </div>
  );
};
