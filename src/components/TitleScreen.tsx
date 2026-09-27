import React, { useEffect, useRef } from 'react';
import {
  Play,
  Rocket,
  Microscope,
  Palette,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  User,
  Coins,
  Users,
  Compass,
} from 'lucide-react';

interface TitleScreenProps {
  hasSaveData: boolean;
  saveSummaryText: string;
  activePilotName?: string;
  activePilotCoins?: number;
  activePilotPointsSpent?: number;
  activePilotTierBadge?: string;
  onOpenCharacterModal?: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onStartFreeRoam?: () => void;
  onWatchStoryVideo: () => void;
  onOpenPhysics: () => void;
  onOpenGarage: () => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (val: boolean) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSaveData,
  saveSummaryText,
  activePilotName = 'Explorer',
  activePilotCoins = 0,
  activePilotPointsSpent = 0,
  activePilotTierBadge = '⚪ CADET RECON',
  onOpenCharacterModal,
  onResume,
  onNewGame,
  onStartFreeRoam,
  onWatchStoryVideo,
  onOpenPhysics,
  onOpenGarage,
  audioEnabled,
  setAudioEnabled,
  voiceEnabled,
  setVoiceEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: Array<{ x: number; y: number; r: number; speed: number }> = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.2 + 0.05,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Space background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#040711');
      bgGrad.addColorStop(0.5, '#080F1E');
      bgGrad.addColorStop(1, '#1A0C08');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#FFFFFF';
      stars.forEach((s) => {
        ctx.globalAlpha = 0.3 + 0.7 * Math.sin(t * 0.03 + s.x);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        s.y -= s.speed;
        if (s.y < 0) s.y = canvas.height;
      });
      ctx.globalAlpha = 1.0;

      // Realistic Mars Globe on horizon
      const marsX = canvas.width / 2;
      const marsY = canvas.height + canvas.width * 0.65;
      const marsR = canvas.width * 0.85;

      // Mars Glow Atmosphere
      const marsGlow = ctx.createRadialGradient(marsX, marsY, marsR * 0.95, marsX, marsY, marsR * 1.15);
      marsGlow.addColorStop(0, 'rgba(230, 126, 34, 0.45)');
      marsGlow.addColorStop(0.5, 'rgba(158, 42, 27, 0.2)');
      marsGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = marsGlow;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Mars body
      const marsBodyGrad = ctx.createRadialGradient(
        marsX,
        marsY - marsR * 0.7,
        marsR * 0.1,
        marsX,
        marsY,
        marsR
      );
      marsBodyGrad.addColorStop(0, '#E67E22');
      marsBodyGrad.addColorStop(0.3, '#D35400');
      marsBodyGrad.addColorStop(0.7, '#9E2A1B');
      marsBodyGrad.addColorStop(1, '#4A1108');
      ctx.fillStyle = marsBodyGrad;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsR, 0, Math.PI * 2);
      ctx.fill();

      t++;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080F1E] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080F1E] via-transparent to-[#080F1E]/80 z-10 pointer-events-none" />

      <div className="relative z-20 max-w-2xl w-full mx-4 glass-panel rounded-2xl p-6 md:p-8 border-2 border-[#E67E22] text-center space-y-5 shadow-2xl">
        {/* Banner */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#4DD0E1]/15 border border-[#4DD0E1]/40 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4DD0E1] animate-ping" />
            <span className="text-[11px] font-orbitron font-bold text-[#4DD0E1] tracking-widest uppercase">
              INTERPLANETARY SCIENTIFIC SIMULATOR
            </span>
          </div>

          <h1 className="font-orbitron font-black text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#E67E22] via-[#FF5722] to-[#4DD0E1] tracking-wider drop-shadow-md">
            MARS ROVER MISSION
          </h1>

          <p className="text-xs md:text-sm font-semibold text-[#F4F7FA]/80 uppercase tracking-widest">
            Prepare the Red Planet for Humanity's Settlement
          </p>
        </div>

        {/* Active Commander Profile Bar */}
        <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-black/70 border border-[#4DD0E1]/50 flex items-center justify-between shadow-2xl backdrop-blur-md">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#4DD0E1]/20 border border-[#4DD0E1]/40 flex items-center justify-center text-[#4DD0E1] flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-white/50 font-orbitron uppercase">COMMANDER:</span>
                <span className="font-orbitron font-black text-sm text-[#4DD0E1]">
                  {activePilotName.toUpperCase()}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/90 font-orbitron font-bold border border-white/20">
                  {activePilotTierBadge}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono mt-0.5">
                <span className="flex items-center space-x-1 text-[#F1C40F]">
                  <Coins className="w-3.5 h-3.5" />
                  <strong>{activePilotCoins.toLocaleString()} Pts</strong>
                </span>
                <span className="text-white/40">•</span>
                <span className="text-white/60">
                  Spent: <strong className="text-[#FF9800]">{activePilotPointsSpent.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {onOpenCharacterModal && (
            <button
              onClick={onOpenCharacterModal}
              className="px-3 py-1.5 rounded-lg bg-[#4DD0E1]/15 hover:bg-[#4DD0E1]/30 border border-[#4DD0E1]/50 text-[#4DD0E1] font-orbitron font-bold text-xs flex items-center space-x-1 cursor-pointer transition-all hover:scale-105 flex-shrink-0"
              title="Switch or register another player"
            >
              <Users className="w-3.5 h-3.5" />
              <span>SWITCH PILOT</span>
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-1 max-w-md mx-auto space-y-2.5">
          {hasSaveData ? (
            <button
              onClick={onResume}
              className="w-full glass-panel glass-panel-interactive py-3 px-6 rounded-xl font-orbitron font-black text-sm text-black bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] hover:from-[#4DD0E1] hover:to-[#2ECC71] transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>RESUME MISSION</span>
            </button>
          ) : null}

          <button
            onClick={onNewGame}
            className="w-full glass-panel glass-panel-interactive py-3 px-6 rounded-xl font-orbitron font-black text-sm text-white bg-gradient-to-r from-[#E67E22] to-[#FF5722] hover:from-[#FF5722] hover:to-[#9E2A1B] transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Rocket className="w-5 h-5" />
            <div className="flex flex-col items-center">
              <span>{hasSaveData ? 'START NEW EXPEDITION' : 'START EXPEDITION'}</span>
              {hasSaveData && (
                <span className="text-[10px] font-mono text-[#F1C40F] tracking-normal font-normal">
                  (KEEPS {activePilotCoins.toLocaleString()} COINS & ALL GARAGE UNLOCKS)
                </span>
              )}
            </div>
          </button>

          {/* Free Roam Exploration Mode Button */}
          {onStartFreeRoam && (
            <button
              onClick={onStartFreeRoam}
              className="w-full glass-panel glass-panel-interactive py-3 px-4 rounded-xl font-orbitron font-bold text-xs text-amber-300 border border-amber-400/60 bg-gradient-to-r from-amber-950/60 via-black/80 to-amber-950/40 hover:brightness-125 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_20px_rgba(241,196,15,0.25)]"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>FREE ROAM EXPLORATION MODE (SURVEY MARS)</span>
            </button>
          )}

          {/* Watch Story Video Button */}
          <button
            onClick={onWatchStoryVideo}
            className="w-full glass-panel glass-panel-interactive py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs text-[#4DD0E1] border border-[#4DD0E1]/40 bg-[#4DD0E1]/10 hover:bg-[#4DD0E1]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
          >
            <Video className="w-4 h-4 text-[#4DD0E1]" />
            <span>WATCH MISSION STORY VIDEO</span>
          </button>

          {hasSaveData && (
            <div className="text-[11px] font-orbitron font-semibold text-[#4DD0E1] bg-[#080F1E]/80 px-3 py-1.5 rounded-lg border border-[#4DD0E1]/30">
              SAVED MISSION: <span className="text-white">{saveSummaryText}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={onOpenPhysics}
              className="glass-panel glass-panel-interactive py-2.5 px-3 rounded-xl font-orbitron font-bold text-xs text-[#E67E22] border border-[#E67E22]/40 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Microscope className="w-4 h-4" />
              <span>PHYSICS LAB</span>
            </button>

            <button
              onClick={onOpenGarage}
              className="glass-panel glass-panel-interactive py-2.5 px-3 rounded-xl font-orbitron font-bold text-xs text-[#F1C40F] border border-[#F1C40F]/40 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span>ROVER GARAGE</span>
            </button>
          </div>
        </div>

        {/* Audio / Voice Toggles */}
        <div className="flex items-center justify-center space-x-6 text-xs text-[#F4F7FA]/70 pt-3 border-t border-[#4DD0E1]/20">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              audioEnabled
                ? 'border-[#E67E22]/60 text-[#E67E22] bg-[#E67E22]/10'
                : 'border-white/15 text-white/40'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>SYNTH AUDIO FX</span>
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              voiceEnabled
                ? 'border-[#4DD0E1]/60 text-[#4DD0E1] bg-[#4DD0E1]/10'
                : 'border-white/15 text-white/40'
            }`}
          >
            {voiceEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>RADIO NARRATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
