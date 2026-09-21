import React, { useState } from 'react';
import { Flame, CheckCircle2, X, ShieldAlert } from 'lucide-react';

interface LavaPlatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const LavaPlatesModal: React.FC<LavaPlatesModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [valves, setValves] = useState<[number, number, number]>([30, 40, 25]);

  if (!isOpen) return null;

  const adjustValve = (idx: number, delta: number) => {
    setValves((prev) => {
      const next = [...prev] as [number, number, number];
      next[idx] = Math.max(0, Math.min(100, next[idx] + delta));
      return next;
    });
  };

  // Optimal tempering zone is 60-80% on all 3 heat dissipators
  const isTempered = valves.every((v) => v >= 60 && v <= 85);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-lg w-full glass-panel rounded-2xl p-6 border-2 border-[#FF3D00] space-y-4 text-center shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#FF3D00]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#FF3D00]">
            <Flame className="w-5 h-5 animate-pulse" />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              LEVEL 4 UPGRADE: CERAMIC LAVA HEAT SHIELD
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#F4F7FA]/80 text-left">
          Calibrate the 3 liquid nitrogen coolant heat-exchangers into the optimal thermal range (<strong>60% - 85%</strong>) to temper the ceramic heat shields for safe lava chasm navigation.
        </p>

        <div className="space-y-3 bg-[#080F1E] p-4 rounded-xl border border-[#FF3D00]/30">
          {(['CRYOGENIC VALVE A', 'CERAMIC MATRIX B', 'ABLATIVE VENT C'] as const).map((label, idx) => {
            const val = valves[idx];
            const inRange = val >= 60 && val <= 85;

            return (
              <div key={label} className="space-y-1 text-left">
                <div className="flex justify-between text-xs font-orbitron font-semibold">
                  <span className="text-white/80">{label}</span>
                  <span className={inRange ? 'text-[#2ECC71]' : 'text-[#FF3D00]'}>
                    {val}% {inRange ? '(OPTIMAL)' : '(UNBALANCED)'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => adjustValve(idx, -10)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-orbitron text-xs cursor-pointer"
                  >
                    -10%
                  </button>
                  <div className="flex-1 h-3.5 bg-black/60 rounded-full overflow-hidden border border-white/15 relative">
                    <div
                      className={`h-full transition-all duration-200 ${
                        inRange ? 'bg-gradient-to-r from-[#2ECC71] to-[#00E5FF]' : 'bg-gradient-to-r from-[#FF9800] to-[#FF3D00]'
                      }`}
                      style={{ width: `${val}%` }}
                    />
                    {/* Optimal indicator window */}
                    <div className="absolute top-0 bottom-0 left-[60%] w-[25%] border-x-2 border-dashed border-white/60 bg-white/10 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => adjustValve(idx, 10)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-orbitron text-xs cursor-pointer"
                  >
                    +10%
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onComplete}
          disabled={!isTempered}
          className={`w-full py-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
            isTempered
              ? 'bg-gradient-to-r from-[#FF5722] to-[#FF3D00] text-white shadow-lg shadow-orange-900/40 cursor-pointer hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isTempered ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>INSTALL CERAMIC HEAT PLATING (+85 SP)</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-white/40" />
              <span>ALIGN ALL COOLANT CHANNELS TO 60%-85%</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
