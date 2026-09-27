import React from 'react';
import { Trophy, BatteryCharging, Award, ArrowRight } from 'lucide-react';

interface LevelCompleteModalProps {
  isOpen: boolean;
  levelNum: number;
  totalDiscoveries: number;
  batteryRemaining: number;
  onProceed: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  levelNum,
  totalDiscoveries,
  batteryRemaining,
  onProceed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
      <div className="max-w-md w-full glass-panel rounded-2xl p-6 border-2 border-[#2ECC71] text-center space-y-4 shadow-2xl">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#2ECC71]/20 border-2 border-[#2ECC71] flex items-center justify-center text-[#2ECC71]">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="font-orbitron font-black text-2xl text-[#2ECC71]">
            {levelNum === 5 ? 'MARS COLONIZATION TRIUMPH!' : 'BIOME MISSION ACCOMPLISHED!'}
          </h2>
          <p className="text-xs text-[#F4F7FA]/70">
            {levelNum === 5
              ? 'Humanity has successfully explored all 5 biomes and established the permanent Mars colony!'
              : `All primary scientific objectives for Biome Level ${levelNum} completed.`}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl text-xs space-y-2.5 text-left border border-white/10">
          <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
            <span className="flex items-center space-x-1.5 text-white/70">
              <Award className="w-4 h-4 text-[#F1C40F]" />
              <span>Scientific Discoveries:</span>
            </span>
            <strong className="text-white font-orbitron">{totalDiscoveries} Logged</strong>
          </div>

          <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
            <span className="flex items-center space-x-1.5 text-white/70">
              <BatteryCharging className="w-4 h-4 text-[#2ECC71]" />
              <span>Battery Remaining:</span>
            </span>
            <strong className="text-[#2ECC71] font-orbitron">{Math.round(batteryRemaining)}%</strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70">Bonus Science Points:</span>
            <strong className="text-[#F1C40F] font-orbitron">+150 SP</strong>
          </div>
        </div>

        <button
          onClick={onProceed}
          className="w-full py-3.5 rounded-xl font-orbitron font-bold text-sm bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black hover:opacity-90 transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
        >
          <span>
            {levelNum < 5
              ? `PROCEED TO BIOME ${levelNum + 1}`
              : 'WATCH EPILOGUE: 10 YEARS LATER (HUMANS POPULATING EARTH)'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
