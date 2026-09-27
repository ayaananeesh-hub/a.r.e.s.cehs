import React, { useState } from 'react';
import {
  Play,
  Save,
  Microscope,
  LogOut,
  X,
  Video,
  RotateCcw,
  AlertTriangle,
  Users,
  Check,
  Zap,
  ShieldAlert,
} from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  activePilotName?: string;
  isAresUser?: boolean;
  onResume: () => void;
  onSave: () => void;
  onOpenPhysics: () => void;
  onMainMenu: () => void;
  onWatchStoryVideo?: () => void;
  onResetCharacter?: () => void;
  onSwitchPilot?: () => void;
  onOpenTeleportModal?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  activePilotName = 'Explorer',
  isAresUser = false,
  onResume,
  onSave,
  onOpenPhysics,
  onMainMenu,
  onWatchStoryVideo,
  onResetCharacter,
  onSwitchPilot,
  onOpenTeleportModal,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirmReset = () => {
    if (onResetCharacter) {
      onResetCharacter();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setShowResetConfirm(false);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none">
      <div className="max-w-md w-full glass-panel rounded-2xl p-6 border border-[#4DD0E1] text-center space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#4DD0E1]/30 pb-2">
          <div className="text-left">
            <h2 className="font-orbitron font-bold text-lg text-[#4DD0E1]">MISSION PAUSED</h2>
            <span className="text-[11px] font-orbitron text-white/70">
              COMMANDER: <strong className="text-[#E67E22]">{activePilotName.toUpperCase()}</strong>
            </span>
          </div>
          <button onClick={onResume} className="text-white/60 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Actions */}
        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs bg-[#4DD0E1] text-black hover:bg-[#2ECC71] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4" />
            <span>RESUME MISSION</span>
          </button>

          {isAresUser && onOpenTeleportModal && (
            <button
              onClick={() => {
                onResume();
                onOpenTeleportModal();
              }}
              className="w-full py-3 rounded-xl font-orbitron font-black text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black hover:brightness-110 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(241,196,15,0.4)] animate-pulse"
            >
              <Zap className="w-4 h-4 fill-black text-black" />
              <span>A.R.E.S. BIOME TELEPORT MATRIX</span>
            </button>
          )}

          {onWatchStoryVideo && (
            <button
              onClick={onWatchStoryVideo}
              className="w-full py-2.5 rounded-xl font-orbitron font-bold text-xs glass-panel text-[#4DD0E1] border border-[#4DD0E1]/40 bg-[#4DD0E1]/10 hover:bg-[#4DD0E1]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Video className="w-4 h-4 text-[#4DD0E1]" />
              <span>WATCH STORY VIDEO</span>
            </button>
          )}

          <button
            onClick={onSave}
            className="w-full py-2.5 rounded-xl font-orbitron font-bold text-xs glass-panel text-[#2ECC71] border border-[#2ECC71]/40 hover:bg-[#2ECC71]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE TELEMETRY FOR {activePilotName.toUpperCase()}</span>
          </button>

          <button
            onClick={onOpenPhysics}
            className="w-full py-2.5 rounded-xl font-orbitron font-bold text-xs glass-panel text-white hover:text-[#E67E22] border border-white/15 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Microscope className="w-4 h-4" />
            <span>BIOME PHYSICS LAB</span>
          </button>

          {/* Commander & Pilot Settings Section */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-orbitron font-bold text-white/50 tracking-wider uppercase text-left px-1">
              COMMANDER PROFILE SETTINGS
            </div>

            {onSwitchPilot && (
              <button
                onClick={onSwitchPilot}
                className="w-full py-2.5 rounded-xl font-orbitron font-bold text-xs glass-panel text-[#4DD0E1] border border-[#4DD0E1]/30 hover:bg-[#4DD0E1]/15 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>SWITCH PILOT / LOG IN</span>
              </button>
            )}

            {/* Reset Character Accordion / Confirmation */}
            {isAresUser ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5 text-center flex items-center justify-center space-x-2 text-[11px] font-orbitron text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>A.R.E.S. PROFILE IS IMMUTABLE & PROTECTED</span>
              </div>
            ) : onResetCharacter ? (
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-2.5 text-left transition-all">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 rounded-lg font-orbitron font-bold text-xs text-[#FF5722] hover:text-red-400 flex items-center justify-center space-x-2 cursor-pointer hover:bg-red-500/10 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RESET CHARACTER DATA</span>
                  </button>
                ) : (
                  <div className="space-y-2 text-center p-1">
                    <div className="flex items-center justify-center space-x-1.5 text-amber-400 font-orbitron font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                      <span>CONFIRM RESET FOR "{activePilotName}"?</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                      This will reset {activePilotName}'s coins, upgrades, and level progress back to Day 1. Other characters will not be affected.
                    </p>
                    {resetSuccess ? (
                      <div className="py-2 text-emerald-400 font-orbitron font-bold text-xs flex items-center justify-center space-x-1.5">
                        <Check className="w-4 h-4" />
                        <span>CHARACTER DATA RESET TO INITIAL!</span>
                      </div>
                    ) : (
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={handleConfirmReset}
                          className="flex-1 py-1.5 rounded-lg bg-[#FF3D00] hover:bg-red-700 text-white font-orbitron font-bold text-xs cursor-pointer shadow-md"
                        >
                          YES, RESET
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-xl font-orbitron font-bold text-xs bg-[#9E2A1B] text-white hover:bg-[#FF5722] flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>RETURN TO TITLE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
