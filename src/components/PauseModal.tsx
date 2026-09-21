import React from 'react';
import { Play, Save, Microscope, LogOut, X, Film } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onSave: () => void;
  onOpenPhysics: () => void;
  onMainMenu: () => void;
  onWatchCinematic?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onSave,
  onOpenPhysics,
  onMainMenu,
  onWatchCinematic,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-md w-full glass-panel rounded-2xl p-6 border border-[#4DD0E1] text-center space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#4DD0E1]/30 pb-2">
          <h2 className="font-orbitron font-bold text-lg text-[#4DD0E1]">MISSION PAUSED</h2>
          <button onClick={onResume} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs bg-[#4DD0E1] text-black hover:bg-[#2ECC71] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4" />
            <span>RESUME MISSION</span>
          </button>

          {onWatchCinematic && (
            <button
              onClick={onWatchCinematic}
              className="w-full py-3 rounded-xl font-orbitron font-bold text-xs glass-panel text-[#00E5FF] border border-[#00E5FF]/40 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Film className="w-4 h-4 text-[#00E5FF] animate-pulse" />
              <span>REPLAY 3D CINEMATIC INTRO (EDL)</span>
            </button>
          )}

          <button
            onClick={onSave}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs glass-panel text-[#2ECC71] border border-[#2ECC71]/40 hover:bg-[#2ECC71]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE MISSION TELEMETRY</span>
          </button>

          <button
            onClick={onOpenPhysics}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs glass-panel text-white hover:text-[#E67E22] border border-white/15 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Microscope className="w-4 h-4" />
            <span>BIOME PHYSICS LAB</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs bg-[#9E2A1B] text-white hover:bg-[#FF5722] flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>RETURN TO TITLE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
