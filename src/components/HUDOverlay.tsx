import React, { useRef, useEffect } from 'react';
import {
  Pause,
  Radio,
  Sparkles,
  Wrench,
  Palette,
  BookOpen,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LevelConfig, RoverState, SkinItem } from '../types';

interface HUDOverlayProps {
  currentLevel: LevelConfig;
  rover: RoverState;
  activeSkin: SkinItem;
  currentObjectiveText: string;
  radioSubtitleText: string | null;
  nearInteractive: boolean;
  inLavaHazard?: boolean;
  onPause: () => void;
  onRadarScan: () => void;
  onOpenCleaner: () => void;
  onOpenUpgradeLab: () => void;
  onOpenGarage: () => void;
  onOpenScienceLog: () => void;
  onOpenApkModal: () => void;
  // Touch handlers
  onTouchDirection: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onTouchInteract: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  currentLevel,
  rover,
  activeSkin,
  currentObjectiveText,
  radioSubtitleText,
  nearInteractive,
  inLavaHazard = false,
  onPause,
  onRadarScan,
  onOpenCleaner,
  onOpenUpgradeLab,
  onOpenGarage,
  onOpenScienceLog,
  onOpenApkModal,
  onTouchDirection,
  onTouchInteract,
}) => {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // Render Minimap
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#080F1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / currentLevel.mapWidth;
    const scaleY = canvas.height / currentLevel.mapHeight;

    // Grid lines
    ctx.strokeStyle = 'rgba(77, 208, 225, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Lava zones on minimap
    if (currentLevel.lavaZones) {
      ctx.fillStyle = 'rgba(255, 61, 0, 0.45)';
      currentLevel.lavaZones.forEach((lz) => {
        ctx.fillRect(lz.x * scaleX, lz.y * scaleY, lz.width * scaleX, lz.height * scaleY);
      });
    }

    // Safe basalt paths on minimap
    if (currentLevel.lavaPaths) {
      currentLevel.lavaPaths.forEach((p) => {
        if (p.type === 'segment' && p.x1 !== undefined && p.y1 !== undefined && p.x2 !== undefined && p.y2 !== undefined) {
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = Math.max(2.5, (p.width || 100) * scaleX);
          ctx.beginPath();
          ctx.moveTo(p.x1 * scaleX, p.y1 * scaleY);
          ctx.lineTo(p.x2 * scaleX, p.y2 * scaleY);
          ctx.stroke();
        } else if (p.type === 'island' && p.cx !== undefined && p.cy !== undefined) {
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.arc(p.cx * scaleX, p.cy * scaleY, Math.max(3, (p.radius || 100) * scaleX), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Targets on minimap
    currentLevel.targets.forEach((t) => {
      ctx.fillStyle = t.type === 'station' ? '#FF5722' : t.type === 'sample' ? '#E67E22' : '#4DD0E1';
      ctx.fillRect(t.x * scaleX - 2.5, t.y * scaleY - 2.5, 5, 5);
    });

    // Rover marker
    ctx.fillStyle = activeSkin.color || '#4DD0E1';
    ctx.beginPath();
    ctx.arc(rover.x * scaleX, rover.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rover forward heading vector
    const dirX = rover.x * scaleX + Math.cos(rover.angle) * 8;
    const dirY = rover.y * scaleY + Math.sin(rover.angle) * 8;
    ctx.strokeStyle = '#4DD0E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rover.x * scaleX, rover.y * scaleY);
    ctx.lineTo(dirX, dirY);
    ctx.stroke();
  }, [currentLevel, rover, activeSkin]);

  const speedKmh = (Math.abs(rover.speed) * 3.6).toFixed(1);
  const batteryPct = Math.round(rover.battery);
  const solarEffPct = Math.round(100 - rover.dust);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 md:p-4 select-none">
      {/* TOP HUD ROW */}
      <div className="flex justify-between items-start w-full pointer-events-auto gap-2">
        {/* Left: Mission Objectives */}
        <div className="glass-panel rounded-xl p-3 max-w-xs md:max-w-md w-full border-l-4 border-l-[#4DD0E1] shadow-lg">
          <div className="flex items-center justify-between border-b border-[#4DD0E1]/30 pb-1 mb-1.5">
            <span className="font-orbitron font-bold text-[11px] md:text-xs text-[#4DD0E1] tracking-wider uppercase truncate">
              {currentLevel.title}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#9E2A1B]/60 text-[#E67E22] font-bold border border-[#E67E22]/40 whitespace-nowrap ml-1">
              EXPEDITION
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-[#F4F7FA]/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#E67E22] flex-shrink-0" />
            <span className="font-medium">{currentObjectiveText}</span>
          </div>
        </div>

        {/* Center: Mission Control Radio Transmission */}
        {radioSubtitleText && (
          <div className="hidden sm:flex glass-panel rounded-xl px-4 py-2 max-w-md w-full text-center border-t-2 border-t-[#E67E22] flex-col items-center animate-fade-in shadow-xl">
            <span className="text-[10px] font-orbitron text-[#E67E22] tracking-widest uppercase flex items-center space-x-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>MISSION CONTROL INCOMING TRANSMISSION</span>
            </span>
            <p className="text-xs md:text-sm font-semibold text-white italic mt-0.5">
              "{radioSubtitleText}"
            </p>
          </div>
        )}

        {/* Right: Minimap & System Controls */}
        <div className="flex flex-col items-end space-y-2">
          <div className="glass-panel rounded-xl p-1.5 relative overflow-hidden border border-[#4DD0E1]/40 shadow-lg">
            <canvas
              ref={minimapRef}
              width={120}
              height={120}
              className="rounded-lg bg-[#080F1E] block"
            />
            <div className="absolute top-2.5 right-2.5 text-[9px] font-orbitron font-bold text-[#4DD0E1] bg-[#080F1E]/90 px-1 py-0.5 rounded border border-[#4DD0E1]/30">
              N ↑
            </div>
          </div>

          <div className="flex space-x-1.5">
            <button
              onClick={onOpenApkModal}
              className="glass-panel glass-panel-interactive px-2.5 py-1.5 rounded-lg text-xs font-orbitron font-bold text-[#4DD0E1] flex items-center space-x-1 cursor-pointer"
              title="Android APK / Install"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">APK</span>
            </button>
            <button
              onClick={onPause}
              className="glass-panel glass-panel-interactive px-2.5 py-1.5 rounded-lg text-xs font-orbitron font-bold text-[#E67E22] flex items-center space-x-1 cursor-pointer"
              title="Pause Mission"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>(P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CENTER HUD INTERACTION PROMPTS & WARNINGS */}
      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
        {nearInteractive && (
          <div className="glass-panel px-6 py-2 rounded-full text-xs md:text-sm font-orbitron font-bold text-[#E67E22] border border-[#E67E22] animate-bounce shadow-xl">
            PRESS 'E' OR TAP ACTION TO INTERACT
          </div>
        )}
        {inLavaHazard && (
          <div className="glass-panel px-5 py-2.5 rounded-xl text-xs md:text-sm font-orbitron font-black text-[#FF3D00] border-2 border-[#FF3D00] bg-black/90 animate-pulse flex items-center space-x-2 shadow-2xl">
            <AlertTriangle className="w-5 h-5 text-[#FF3D00] animate-bounce flex-shrink-0" />
            <span>CRITICAL THERMAL ALERT: IN MOLTEN LAVA! RETURN TO BASALT PATH!</span>
          </div>
        )}
        {currentLevel.biome === 'lava' && !inLavaHazard && (
          <div className="glass-panel px-3.5 py-1 rounded-lg text-[11px] font-orbitron font-semibold text-[#FF5722] border border-[#FF5722]/50 flex items-center space-x-1.5 bg-black/50">
            <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-ping" />
            <span>ACTIVE MAGMA ZONE: REMAIN STRICTLY ON DESIGNATED BASALT PATHS</span>
          </div>
        )}
        {currentLevel.biome === 'ice' && (
          <div className="glass-panel warning-pulse px-4 py-1.5 rounded-lg text-xs font-orbitron font-bold text-[#4DD0E1] border border-[#4DD0E1] flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>LOW TRACTION POLAR GLACIER SURFACE</span>
          </div>
        )}
        {currentLevel.biome === 'summit' && (
          <div className="glass-panel px-3.5 py-1 rounded-lg text-[11px] font-orbitron font-semibold text-[#7E57C2] border border-[#7E57C2]/50 flex items-center space-x-1.5 bg-black/50">
            <span className="w-2 h-2 rounded-full bg-[#7E57C2] animate-ping" />
            <span>OLYMPUS MONS APEX: 21,287 METERS ALTITUDE • LOW DRAG</span>
          </div>
        )}
      </div>

      {/* BOTTOM HUD ROW */}
      <div className="flex flex-col md:flex-row justify-between items-end w-full gap-2 pointer-events-auto">
        {/* Telemetry & Rover Systems */}
        <div className="glass-panel rounded-xl p-3 w-full md:w-80 space-y-2 border-b-2 border-b-[#4DD0E1] shadow-lg">
          <div className="flex justify-between items-center text-xs border-b border-[#4DD0E1]/20 pb-1">
            <span className="text-[#F4F7FA]/70">
              SCIENCE PTS:{' '}
              <strong className="text-[#F1C40F] font-orbitron font-black text-sm ml-1">
                {rover.sciencePoints || 0} SP
              </strong>
            </span>
            <span className="text-[#F4F7FA]/70">
              SPEED: <strong className="text-white font-orbitron ml-1">{speedKmh} km/h</strong>
            </span>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-[#4DD0E1]/20 pb-1">
            <span className="text-[#F4F7FA]/70">
              BIOME: <strong className="text-[#4DD0E1] uppercase ml-1">{currentLevel.biome}</strong>
            </span>
            <span className="text-[#F4F7FA]/70">
              TEMP:{' '}
              <strong
                className={`font-orbitron ml-1 ${
                  inLavaHazard
                    ? 'text-[#FF3D00] animate-pulse'
                    : currentLevel.biome === 'lava'
                    ? 'text-[#FF5722]'
                    : currentLevel.biome === 'ice'
                    ? 'text-[#4DD0E1]'
                    : currentLevel.biome === 'summit'
                    ? 'text-[#7E57C2]'
                    : 'text-white'
                }`}
              >
                {currentLevel.biome === 'ice'
                  ? '-94°C'
                  : currentLevel.biome === 'lava'
                  ? inLavaHazard
                    ? '+1280°C'
                    : '+580°C'
                  : currentLevel.biome === 'summit'
                  ? '-115°C'
                  : '-62°C'}
              </strong>
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron font-semibold mb-1">
              <span className="text-[#F4F7FA]/70">BATTERY POWER</span>
              <span
                className={
                  batteryPct > 40
                    ? 'text-[#2ECC71]'
                    : batteryPct > 20
                    ? 'text-[#E67E22]'
                    : 'text-[#FF5722]'
                }
              >
                {batteryPct}%
              </span>
            </div>
            <div className="w-full bg-[#080F1E] h-2 rounded-full overflow-hidden border border-[#4DD0E1]/30">
              <div
                className={`h-full transition-all duration-300 ${
                  batteryPct > 40
                    ? 'bg-[#2ECC71]'
                    : batteryPct > 20
                    ? 'bg-[#E67E22]'
                    : 'bg-[#FF5722]'
                }`}
                style={{ width: `${batteryPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron font-semibold mb-1">
              <span className="text-[#F4F7FA]/70">SOLAR EFFICIENCY (DUST)</span>
              <span className="text-[#E67E22]">{solarEffPct}%</span>
            </div>
            <div className="w-full bg-[#080F1E] h-2 rounded-full overflow-hidden border border-[#4DD0E1]/30">
              <div
                className="bg-[#E67E22] h-full transition-all duration-300"
                style={{ width: `${solarEffPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Hotkeys / Buttons */}
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
          <button
            onClick={onRadarScan}
            className="glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold text-[#4DD0E1] flex flex-col items-center cursor-pointer shadow-md"
          >
            <div className="flex items-center space-x-1">
              <Radio className="w-3.5 h-3.5" />
              <span>RADAR SCAN</span>
            </div>
            <span className="text-[9px] text-[#F4F7FA]/60 font-normal">(SPACE)</span>
          </button>

          <button
            onClick={onOpenCleaner}
            className="glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold text-[#E67E22] flex flex-col items-center cursor-pointer shadow-md"
          >
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CLEAN PANELS</span>
            </div>
            <span className="text-[9px] text-[#F4F7FA]/60 font-normal">(R)</span>
          </button>

          <button
            onClick={onOpenUpgradeLab}
            className="glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold text-[#FF5722] flex flex-col items-center animate-pulse cursor-pointer shadow-md"
          >
            <div className="flex items-center space-x-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>UPGRADE LAB</span>
            </div>
            <span className="text-[9px] text-[#F4F7FA]/60 font-normal">(MINIGAME)</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold text-[#F1C40F] flex flex-col items-center cursor-pointer shadow-md"
          >
            <div className="flex items-center space-x-1">
              <Palette className="w-3.5 h-3.5" />
              <span>ROVER GARAGE</span>
            </div>
            <span className="text-[9px] text-[#F4F7FA]/60 font-normal">(CUSTOMIZE)</span>
          </button>

          <button
            onClick={onOpenScienceLog}
            className="glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold text-[#2ECC71] flex flex-col items-center cursor-pointer shadow-md"
          >
            <div className="flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>SCIENCE LOG</span>
            </div>
            <span className="text-[9px] text-[#F4F7FA]/60 font-normal">(LOG)</span>
          </button>
        </div>

        {/* Right Environmental Telemetry */}
        <div className="glass-panel rounded-xl p-3 w-full md:w-60 space-y-1 border-b-2 border-b-[#E67E22] text-xs shadow-lg">
          <div className="flex justify-between">
            <span className="text-[#F4F7FA]/70">UPGRADE TREADS:</span>
            <span
              className={`font-orbitron font-bold ${
                rover.upgrades.duneTreads ? 'text-[#2ECC71]' : 'text-[#FF5722]'
              }`}
            >
              {rover.upgrades.duneTreads ? 'ACTIVE' : 'LOCKED'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#F4F7FA]/70">ATMOSPHERE TEMP:</span>
            <span className="font-orbitron text-white">
              {currentLevel.biome === 'ice' ? '-94°C' : '-62°C'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#F4F7FA]/70">WIND SPEED:</span>
            <span className="font-orbitron text-white">14 km/h</span>
          </div>
        </div>
      </div>

      {/* MOBILE TOUCH CONTROLS OVERLAY (VISIBLE ON TOUCH/MOBILE SCREENS) */}
      <div className="md:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-4 pb-20 z-30">
        {/* Virtual D-Pad */}
        <div className="relative w-36 h-36 bg-black/45 backdrop-blur-sm rounded-full border border-white/20 pointer-events-auto flex flex-col justify-between items-center p-2 shadow-2xl">
          <button
            onPointerDown={() => onTouchDirection('up', true)}
            onPointerUp={() => onTouchDirection('up', false)}
            onPointerLeave={() => onTouchDirection('up', false)}
            className="w-10 h-10 rounded-full bg-white/20 active:bg-[#4DD0E1]/80 flex items-center justify-center font-bold text-lg text-white"
          >
            ▲
          </button>
          <div className="flex justify-between w-full">
            <button
              onPointerDown={() => onTouchDirection('left', true)}
              onPointerUp={() => onTouchDirection('left', false)}
              onPointerLeave={() => onTouchDirection('left', false)}
              className="w-10 h-10 rounded-full bg-white/20 active:bg-[#4DD0E1]/80 flex items-center justify-center font-bold text-lg text-white"
            >
              ◀
            </button>
            <button
              onPointerDown={() => onTouchDirection('right', true)}
              onPointerUp={() => onTouchDirection('right', false)}
              onPointerLeave={() => onTouchDirection('right', false)}
              className="w-10 h-10 rounded-full bg-white/20 active:bg-[#4DD0E1]/80 flex items-center justify-center font-bold text-lg text-white"
            >
              ▶
            </button>
          </div>
          <button
            onPointerDown={() => onTouchDirection('down', true)}
            onPointerUp={() => onTouchDirection('down', false)}
            onPointerLeave={() => onTouchDirection('down', false)}
            className="w-10 h-10 rounded-full bg-white/20 active:bg-[#4DD0E1]/80 flex items-center justify-center font-bold text-lg text-white"
          >
            ▼
          </button>
        </div>

        {/* Touch Action Buttons */}
        <div className="flex flex-col space-y-2 pointer-events-auto">
          <button
            onClick={onTouchInteract}
            className="w-14 h-14 rounded-full bg-[#E67E22] text-black font-orbitron font-black text-xs shadow-xl active:scale-95 flex items-center justify-center border-2 border-white/30"
          >
            ACTION [E]
          </button>
          <button
            onClick={onRadarScan}
            className="w-14 h-14 rounded-full bg-[#4DD0E1] text-black font-orbitron font-black text-xs shadow-xl active:scale-95 flex items-center justify-center border-2 border-white/30"
          >
            SCAN
          </button>
        </div>
      </div>
    </div>
  );
};
