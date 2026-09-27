import React, { useEffect } from 'react';
import { ShieldAlert, RotateCcw, Home, Volume2, Sparkles, AlertTriangle } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  activePilotName?: string;
  currentLevelNum: number;
  onRestartMission: () => void;
  onMainMenu: () => void;
  onReplayVoice?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  activePilotName = 'Commander',
  currentLevelNum,
  onRestartMission,
  onMainMenu,
  onReplayVoice,
}) => {
  useEffect(() => {
    // Keep focus or handle Escape key if needed
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in select-none">
      <div className="max-w-lg w-full glass-panel rounded-3xl p-6 sm:p-8 border-2 border-[#FF3D00] shadow-[0_0_80px_rgba(255,61,0,0.45)] text-center space-y-5">
        
        {/* Pulsing Danger Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-[#FF3D00]/20 border-2 border-[#FF3D00] flex items-center justify-center shadow-[0_0_40px_rgba(255,61,0,0.6)] animate-pulse">
          <ShieldAlert className="w-10 h-10 text-[#FF3D00]" />
          <div className="absolute -inset-1 rounded-2xl border border-[#FF3D00]/50 animate-ping pointer-events-none" />
        </div>

        {/* Title & Status */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-[10px] font-orbitron font-bold text-red-300 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>CRITICAL CHASSIS FAILURE • 0 / 100 HP</span>
          </div>

          <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-red-400 tracking-wider">
            MISSION FAILED • GAME OVER
          </h1>

          <p className="text-sm font-rajdhani text-white/80 max-w-md mx-auto">
            Rover hull integrity depleted after obstacle impact. Ares Base mission control has recorded telemetry.
          </p>
        </div>

        {/* Voice Announcement Banner */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-red-500/40 flex items-center justify-between text-left">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-orbitron text-red-400 uppercase tracking-wider block">
                MISSION AUDIO DIRECTIVE:
              </span>
              <p className="text-xs font-mono font-bold text-white">
                "Game over! Start a new mission."
              </p>
            </div>
          </div>
          {onReplayVoice && (
            <button
              onClick={onReplayVoice}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-orbitron font-bold cursor-pointer"
              title="Replay Voice Alert"
            >
              REPLAY
            </button>
          )}
        </div>

        {/* Safe points preservation reminder */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 font-orbitron flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#4DD0E1]" />
          <span>All earned points, coins, and garage upgrades remain intact!</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onRestartMission}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF3D00] via-[#FF5722] to-[#E67E22] text-white font-orbitron font-black text-xs sm:text-sm tracking-wider shadow-[0_0_30px_rgba(255,61,0,0.5)] hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>START A NEW MISSION</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center space-x-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>

      </div>
    </div>
  );
};
