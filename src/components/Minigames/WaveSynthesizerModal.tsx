import React, { useState, useEffect, useRef } from 'react';
import { Radio, CheckCircle2, X } from 'lucide-react';

interface WaveSynthesizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const WaveSynthesizerModal: React.FC<WaveSynthesizerModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [freq, setFreq] = useState(500);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isMatch = Math.abs(freq - 850) <= 30;

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Target waveform (green faint guide)
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = 35 + Math.sin(x * 850 * 0.00015 + phase) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Active waveform
      ctx.strokeStyle = isMatch ? '#2ECC71' : '#4DD0E1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = 35 + Math.sin(x * freq * 0.00015 + phase) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.05;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, freq, isMatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-lg w-full glass-panel rounded-2xl p-6 border-2 border-[#4DD0E1] space-y-4 text-center shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#4DD0E1]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#4DD0E1]">
            <Radio className="w-5 h-5 animate-pulse" />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              LEVEL 2 UPGRADE: SUBSURFACE WAVE RADAR
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#F4F7FA]/80 text-left">
          Align the blue radar wave frequency slider to match the green target resonance (<strong className="text-[#2ECC71]">850 MHz</strong>) to unlock the <strong>Subsurface Ice Radar</strong>.
        </p>

        <div className="space-y-4 bg-[#080F1E] p-4 rounded-xl border border-[#4DD0E1]/30 text-left">
          <div>
            <div className="flex justify-between text-xs font-bold text-[#4DD0E1] mb-1">
              <span>RADAR FREQUENCY</span>
              <span className={isMatch ? 'text-[#2ECC71]' : 'text-white'}>{freq} MHz</span>
            </div>
            <input
              type="range"
              min="200"
              max="1200"
              step="10"
              value={freq}
              onChange={(e) => setFreq(parseInt(e.target.value))}
              className="w-full accent-[#4DD0E1] cursor-pointer"
            />
          </div>

          <div className="h-20 bg-black/70 rounded-lg flex items-center justify-center border border-[#4DD0E1]/25 overflow-hidden">
            <canvas ref={canvasRef} width={360} height={70} className="w-full h-full block" />
          </div>

          <div className="flex justify-between text-[11px] font-orbitron">
            <span className="text-white/60">TARGET RESONANCE: 850 MHz</span>
            <span className={`font-bold ${isMatch ? 'text-[#2ECC71]' : 'text-[#E67E22]'}`}>
              {isMatch ? 'RESONANCE LOCKED ✓' : `OFFSET: ${Math.abs(freq - 850)} MHz`}
            </span>
          </div>
        </div>

        <button
          disabled={!isMatch}
          onClick={onComplete}
          className={`w-full py-3 rounded-xl font-orbitron font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
            isMatch
              ? 'bg-[#2ECC71] text-black hover:bg-[#4DD0E1] shadow-lg cursor-pointer'
              : 'bg-gray-700/60 text-white/40 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>CALIBRATE ICE RADAR 📡</span>
        </button>
      </div>
    </div>
  );
};
