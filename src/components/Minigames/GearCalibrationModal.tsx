import React, { useState } from 'react';
import { Settings, CheckCircle2, X } from 'lucide-react';

interface GearCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const GearCalibrationModal: React.FC<GearCalibrationModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [damping, setDamping] = useState(1.0);
  const [torque, setTorque] = useState(0.4);

  if (!isOpen) return null;

  const currentRatio = (damping / torque).toFixed(2);
  const isMatch = Math.abs(parseFloat(currentRatio) - 1.45) < 0.1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-lg w-full glass-panel rounded-2xl p-6 border-2 border-[#E67E22] space-y-4 text-center shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#E67E22]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#E67E22]">
            <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              LEVEL 1 UPGRADE: GEAR TRACTION TUNING
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#F4F7FA]/80 text-left">
          Adjust gear torque sliders to match the green target ratio (Target: <strong className="text-[#2ECC71]">1.45:1</strong>) to unlock <strong>Sand Dune Treads</strong> for your rover.
        </p>

        <div className="space-y-4 bg-[#080F1E] p-4 rounded-xl border border-[#4DD0E1]/30 text-left">
          <div>
            <div className="flex justify-between text-xs font-bold text-[#4DD0E1] mb-1">
              <span>SUSPENSION DAMPING RATIO</span>
              <span>{damping.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={damping}
              onChange={(e) => setDamping(parseFloat(e.target.value))}
              className="w-full accent-[#E67E22] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#4DD0E1] mb-1">
              <span>DRIVE GEAR TORQUE</span>
              <span>{torque.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={torque}
              onChange={(e) => setTorque(parseFloat(e.target.value))}
              className="w-full accent-[#E67E22] cursor-pointer"
            />
          </div>

          <div className="p-2.5 bg-[#040811] rounded-lg border border-white/10 flex items-center justify-between font-orbitron text-sm">
            <span className="text-white/70">CURRENT RATIO:</span>
            <span className={`font-black ${isMatch ? 'text-[#2ECC71]' : 'text-[#FF5722]'}`}>
              {currentRatio}:1 {isMatch ? '✓ TARGET MATCH' : '(ALIGN TO 1.45:1)'}
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
          <span>INSTALL SAND DUNE TREADS 🛠️</span>
        </button>
      </div>
    </div>
  );
};
