import React, { useState } from 'react';
import { Radio, CheckCircle2, X, Sparkles, Cpu } from 'lucide-react';

interface QuantumUplinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const QuantumUplinkModal: React.FC<QuantumUplinkModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [frequencies, setFrequencies] = useState<[boolean, boolean, boolean, boolean]>([true, false, false, true]);

  if (!isOpen) return null;

  const toggleFreq = (idx: number) => {
    setFrequencies((prev) => {
      const next = [...prev] as [boolean, boolean, boolean, boolean];
      next[idx] = !next[idx];
      return next;
    });
  };

  // Target: all 4 quantum harmonic channels synced
  const isSynchronized = frequencies.every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-lg w-full glass-panel rounded-2xl p-6 border-2 border-[#7E57C2] space-y-4 text-center shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#7E57C2]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#7E57C2]">
            <Radio className="w-5 h-5 animate-pulse" />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              LEVEL 5 UPGRADE: DEEP SPACE QUANTUM UPLINK
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#F4F7FA]/80 text-left">
          Lock quantum entanglement resonance with Earth Ground Station Goldstone by engaging all 4 frequency channels at 21.287 GHz.
        </p>

        <div className="grid grid-cols-2 gap-3 bg-[#080F1E] p-4 rounded-xl border border-[#7E57C2]/30">
          {(['ALPHA (14.2 GHz)', 'BETA (18.4 GHz)', 'GAMMA (21.3 GHz)', 'DELTA (28.8 GHz)'] as const).map((label, idx) => {
            const active = frequencies[idx];

            return (
              <button
                key={label}
                onClick={() => toggleFreq(idx)}
                className={`p-3.5 rounded-xl font-orbitron font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-purple-900/50 border-2 border-[#7E57C2] text-[#B39DDB] shadow-lg shadow-purple-900/40'
                    : 'bg-white/5 border border-white/20 text-white/50 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Cpu className={`w-3.5 h-3.5 ${active ? 'text-[#00E5FF]' : 'text-white/30'}`} />
                  <span>{label}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded ${active ? 'bg-[#7E57C2]/40 text-white font-bold' : 'bg-black/40 text-white/40'}`}>
                  {active ? 'SYNCED' : 'UNALIGNED'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onComplete}
          disabled={!isSynchronized}
          className={`w-full py-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
            isSynchronized
              ? 'bg-gradient-to-r from-[#7E57C2] to-[#00E5FF] text-black font-black shadow-lg shadow-purple-900/40 cursor-pointer hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isSynchronized ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>LOCK QUANTUM UPLINK (+100 SP)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white/40" />
              <span>SYNC ALL 4 QUANTUM CHANNELS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
