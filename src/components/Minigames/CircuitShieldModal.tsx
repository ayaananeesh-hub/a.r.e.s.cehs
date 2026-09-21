import React, { useState } from 'react';
import { Zap, CheckCircle2, X } from 'lucide-react';

interface CircuitShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const CircuitShieldModal: React.FC<CircuitShieldModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [nodes, setNodes] = useState<[boolean, boolean, boolean]>([false, false, false]);

  if (!isOpen) return null;

  const toggleNode = (idx: number) => {
    setNodes((prev) => {
      const next = [...prev] as [boolean, boolean, boolean];
      next[idx] = !next[idx];
      return next;
    });
  };

  const allActive = nodes.every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-lg w-full glass-panel rounded-2xl p-6 border-2 border-[#FF5722] space-y-4 text-center shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#FF5722]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#FF5722]">
            <Zap className="w-5 h-5 animate-bounce" />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              LEVEL 3 UPGRADE: THERMAL SHIELD CIRCUIT
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#F4F7FA]/80 text-left">
          Toggle all 3 circuit power relays to [ON] to route thermal protection and unlock <strong>Volcanic Storm Shielding</strong> for your chassis.
        </p>

        <div className="grid grid-cols-3 gap-3 bg-[#080F1E] p-4 rounded-xl border border-[#FF5722]/30">
          {(['A', 'B', 'C'] as const).map((label, i) => {
            const active = nodes[i];
            return (
              <button
                key={label}
                onClick={() => toggleNode(i)}
                className={`p-4 rounded-xl font-orbitron font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-green-900/60 border-2 border-[#2ECC71] text-[#2ECC71] shadow-lg shadow-green-900/30'
                    : 'bg-red-950/60 border border-red-500/60 text-red-300 hover:border-red-400'
                }`}
              >
                <span>NODE {label}</span>
                <span className="text-[10px]">{active ? '[ON]' : '[OFF]'}</span>
              </button>
            );
          })}
        </div>

        <button
          disabled={!allActive}
          onClick={onComplete}
          className={`w-full py-3 rounded-xl font-orbitron font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
            allActive
              ? 'bg-[#2ECC71] text-black hover:bg-[#4DD0E1] shadow-lg cursor-pointer'
              : 'bg-gray-700/60 text-white/40 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>ACTIVATE STORM SHIELDING ⚡</span>
        </button>
      </div>
    </div>
  );
};
