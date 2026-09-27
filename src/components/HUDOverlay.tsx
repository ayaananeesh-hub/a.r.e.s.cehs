import React, { useRef, useEffect } from 'react';
import {
  Pause,
  Radio,
  Sparkles,
  Wrench,
  Palette,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Compass,
  Eye,
  Cog,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Lightbulb,
  Coins,
  User,
  Zap,
} from 'lucide-react';
import { LevelConfig, RoverState, SkinItem } from '../types';
import { CameraMode } from './GameCanvas';
import { biomeTypes } from '../data/gameData';

export interface DangerAlertData {
  text: string;
  subtext?: string;
  type: 'lava' | 'rock' | 'critical' | 'repaired';
}

interface HUDOverlayProps {
  currentLevel: LevelConfig;
  rover: RoverState;
  activeSkin: SkinItem;
  currentObjectiveText: string;
  radioSubtitleText: string | null;
  nearInteractive: boolean;
  inLavaHazard?: boolean;
  dangerAlert?: DangerAlertData | null;
  cameraMode: CameraMode;
  isDrillingSample?: boolean;
  drillingProgress?: number;
  activePilotName?: string;
  onSetCameraMode: (mode: CameraMode) => void;
  onPause: () => void;
  onRadarScan: () => void;
  onOpenCleaner: () => void;
  onOpenUpgradeLab: () => void;
  onOpenGarage: () => void;
  onOpenScienceLog: () => void;
  onOpenLavaBridge?: () => void;
  onToggleHeadlights?: () => void;
  onSwitchPilot?: () => void;
  isAresUser?: boolean;
  onOpenTeleportModal?: () => void;
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
  dangerAlert,
  cameraMode,
  isDrillingSample = false,
  drillingProgress = 0,
  activePilotName = 'Explorer',
  isAresUser = false,
  onOpenTeleportModal,
  onSetCameraMode,
  onPause,
  onRadarScan,
  onOpenCleaner,
  onOpenUpgradeLab,
  onOpenGarage,
  onOpenScienceLog,
  onOpenLavaBridge,
  onToggleHeadlights,
  onSwitchPilot,
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

    // Rock obstacles on minimap
    if (currentLevel.rocks) {
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      currentLevel.rocks.forEach((rock) => {
        ctx.beginPath();
        ctx.arc(rock.x * scaleX, rock.y * scaleY, Math.max(1.8, rock.radius * scaleX), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
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
  const healthPct = Math.max(0, Math.min(100, Math.round(rover.health ?? 100)));
  const solarEffPct = Math.round(100 - rover.dust);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 md:p-4 select-none">
      {/* TOP HUD ROW */}
      <div className="flex justify-between items-start w-full pointer-events-auto gap-2">
        {/* Left: Mission Objectives & Commander Badge */}
        <div className="flex flex-col space-y-1.5 max-w-xs md:max-w-md w-full">
          <div className="glass-panel rounded-xl p-3 border-l-4 border-l-[#4DD0E1] shadow-lg">
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

          {/* Commander Profile & Coins Quick Badge */}
          <div className="glass-panel px-3 py-1.5 rounded-xl border border-white/15 flex items-center justify-between text-xs font-orbitron shadow-md bg-black/70">
            <div className="flex items-center space-x-2 truncate">
              <User className="w-3.5 h-3.5 text-[#4DD0E1] flex-shrink-0" />
              <span className="text-[10px] text-white/60">PILOT:</span>
              <strong className="text-[#E67E22] tracking-wider font-bold truncate max-w-[100px] sm:max-w-[140px]">
                {activePilotName.toUpperCase()}
              </strong>
              <span className="text-white/20">|</span>
              <div className="flex items-center space-x-1 text-[#F1C40F] flex-shrink-0">
                <Coins className="w-3 h-3 text-[#F1C40F]" />
                <strong className="text-xs font-mono font-bold">
                  {(rover.coins ?? rover.dust ?? 0).toLocaleString()} Pts
                </strong>
              </div>
              <span className="text-white/20">|</span>
              <span className="text-[10px] text-white/60">
                Spent: <strong className="text-[#FF9800]">{(rover.pointsSpent ?? 0).toLocaleString()}</strong>
              </span>
            </div>

            {onSwitchPilot && (
              <button
                onClick={onSwitchPilot}
                className="ml-2 text-[9px] px-2 py-0.5 rounded bg-[#4DD0E1]/20 hover:bg-[#4DD0E1]/35 border border-[#4DD0E1]/40 text-[#4DD0E1] font-bold cursor-pointer transition-all whitespace-nowrap"
                title="Switch Commander Profile"
              >
                SWITCH
              </button>
            )}
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

          {/* 3D CAMERA VIEW SELECTOR (100% VISIBLE BELOW MINIMAP) */}
          <div className="flex flex-col items-end space-y-1.5">
            <div className="flex bg-[#080F1E]/95 p-1 rounded-xl border border-[#4DD0E1]/40 shadow-xl space-x-1">
              <button
                onClick={() => onSetCameraMode('chase')}
                className={`px-2 py-1 rounded-lg text-[10px] font-orbitron font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                  cameraMode === 'chase'
                    ? 'bg-[#4DD0E1] text-black shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Third-Person Chase Camera"
              >
                <Camera className="w-3 h-3" />
                <span>CHASE</span>
              </button>
              <button
                onClick={() => onSetCameraMode('topdown')}
                className={`px-2 py-1 rounded-lg text-[10px] font-orbitron font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                  cameraMode === 'topdown'
                    ? 'bg-[#4DD0E1] text-black shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Top-Down Overhead 3D View"
              >
                <Compass className="w-3 h-3" />
                <span>TOP-DOWN</span>
              </button>
              <button
                onClick={() => onSetCameraMode('cockpit')}
                className={`px-2 py-1 rounded-lg text-[10px] font-orbitron font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                  cameraMode === 'cockpit'
                    ? 'bg-[#4DD0E1] text-black shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="First-Person Rover Mast Camera"
              >
                <Eye className="w-3 h-3" />
                <span>MAST</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5">
              {isAresUser && onOpenTeleportModal && (
                <button
                  onClick={onOpenTeleportModal}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-orbitron font-bold text-amber-300 bg-amber-500/20 border-2 border-amber-400 hover:bg-amber-400 hover:text-black flex items-center space-x-1 cursor-pointer transition-all shadow-[0_0_15px_rgba(241,196,15,0.4)] animate-pulse"
                  title="A.R.E.S. Planetary Biome Teleporter"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>WARP</span>
                </button>
              )}

              <button
                onClick={onPause}
                className="glass-panel glass-panel-interactive px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold text-[#E67E22] flex items-center space-x-1 cursor-pointer"
                title="Pause Mission"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>(P)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER VIEWPORT KEPT COMPLETELY OPEN AND UNOBSTRUCTED */}
      <div className="flex-1 pointer-events-none" />

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

          {/* Terrain Grip & Difficulty Telemetry */}
          <div className="flex justify-between items-center text-[10px] font-orbitron border-b border-[#4DD0E1]/20 pb-1">
            <span className="text-white/60">TERRAIN TRACTION:</span>
            <span className="text-[#FF9800] font-bold truncate max-w-[170px]" title={biomeTypes[currentLevel.biome]?.tractionDesc}>
              {biomeTypes[currentLevel.biome]?.tractionDesc || 'STANDARD TRACTION'}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron font-semibold mb-1">
              <span className="flex items-center space-x-1 text-[#F4F7FA]/80">
                {healthPct < 30 ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF3D00] animate-pulse" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
                )}
                <span>HULL INTEGRITY</span>
              </span>
              <span
                className={`font-orbitron font-black text-xs ${
                  healthPct > 65
                    ? 'text-[#2ECC71]'
                    : healthPct > 30
                    ? 'text-[#E67E22]'
                    : 'text-[#FF3D00] animate-pulse'
                }`}
              >
                {Math.round(rover.health ?? 100)} / {Math.round(rover.maxHealth || 100)}
              </span>
            </div>
            <div className="w-full bg-[#080F1E] h-2.5 rounded-full overflow-hidden border border-[#4DD0E1]/30 p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  healthPct > 65
                    ? 'bg-gradient-to-r from-[#27ae60] to-[#2ecc71]'
                    : healthPct > 30
                    ? 'bg-gradient-to-r from-[#d35400] to-[#e67e22]'
                    : 'bg-gradient-to-r from-[#c0392b] to-[#ff3d00] animate-pulse'
                }`}
                style={{ width: `${Math.max(2, healthPct)}%` }}
              />
            </div>
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
          {onToggleHeadlights && (
            <button
              onClick={onToggleHeadlights}
              className={`glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold flex flex-col items-center cursor-pointer shadow-md transition-all ${
                rover.headlightsOn !== false
                  ? 'text-[#F1C40F] border border-[#F1C40F]/50 bg-amber-950/30'
                  : 'text-white/60 border border-white/10 hover:text-white'
              }`}
              title="Toggle Rover High-Output Headlights (H)"
            >
              <div className="flex items-center space-x-1">
                <Lightbulb
                  className={`w-3.5 h-3.5 ${
                    rover.headlightsOn !== false ? 'text-[#F1C40F] fill-current animate-pulse' : 'text-white/40'
                  }`}
                />
                <span>LIGHTS: {rover.headlightsOn !== false ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[9px] text-[#F4F7FA]/60 font-normal">(H)</span>
            </button>
          )}

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

          {currentLevel.biome === 'lava' && onOpenLavaBridge && (
            <button
              onClick={onOpenLavaBridge}
              className="glass-panel glass-panel-interactive px-3 py-1.5 md:py-2 rounded-xl text-xs font-orbitron font-bold text-[#FF3D00] border border-[#FF3D00] flex flex-col items-center cursor-pointer shadow-md bg-red-950/40"
            >
              <div className="flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-[#FF3D00] animate-pulse" />
                <span>LAVA BRIDGE</span>
              </div>
              <span className="text-[9px] text-white/60 font-normal">(BUILD)</span>
            </button>
          )}
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

      {/* 1-SECOND DRILL ANIMATION BANNER AT BOTTOM (LEAVES CENTER OF VIEWPORT CLEAR TO SEE THE DRILL ANIMATION) */}
      {isDrillingSample && (
        <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-auto max-w-[92vw] transition-all">
          <div className="glass-panel px-5 py-2.5 rounded-xl text-xs md:text-sm font-orbitron font-black text-[#F1C40F] border-2 border-[#F1C40F] bg-black/95 shadow-[0_0_35px_rgba(241,196,15,0.7)] flex flex-col items-center space-y-1.5">
            <div className="flex items-center space-x-2">
              <Cog className="w-4 h-4 text-[#F1C40F] animate-spin" />
              <span>ROBOTIC DRILL ENGAGED • EXTRACTING SAMPLE CORE (1.0s)</span>
            </div>
            <div className="w-60 max-w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F1C40F] to-[#E67E22] transition-all duration-75"
                style={{ width: `${Math.min(100, Math.round((drillingProgress || 0) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-white/80 font-sans tracking-normal font-medium">
              Rotary coring bit drilling surface bedrock • Sparks & regolith dust sealed
            </span>
          </div>
        </div>
      )}

      {/* HIGH-VISIBILITY DANGER & HAZARD BANNER AT THE BOTTOM */}
      {dangerAlert && (
        <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-auto max-w-[92vw] transition-all">
          <div
            className={`px-4 py-2 rounded-xl font-orbitron font-black text-xs md:text-sm tracking-widest flex items-center space-x-2.5 shadow-2xl border ${
              dangerAlert.type === 'lava'
                ? 'bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.7)]'
                : dangerAlert.type === 'critical'
                ? 'bg-red-950/95 border-rose-500 text-rose-100 animate-pulse shadow-[0_0_35px_rgba(244,63,94,0.85)]'
                : dangerAlert.type === 'repaired'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.6)]'
                : 'bg-amber-950/95 border-amber-500 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.7)]'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full animate-ping flex-shrink-0 ${
                dangerAlert.type === 'repaired'
                  ? 'bg-emerald-400'
                  : dangerAlert.type === 'rock'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
            />
            {dangerAlert.type === 'lava' ? (
              <Flame className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
            ) : dangerAlert.type === 'repaired' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : dangerAlert.type === 'critical' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <div className="flex flex-col text-left">
              <span className="font-black leading-tight tracking-wider uppercase drop-shadow">
                {dangerAlert.text}
              </span>
              {dangerAlert.subtext && (
                <span className="text-[10px] md:text-xs font-semibold tracking-normal text-white/90 mt-0.5">
                  {dangerAlert.subtext}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CRITICAL LOW INTEGRITY WARNING BANNER IF NO ACTIVE ALERT */}
      {!dangerAlert && healthPct < 25 && (
        <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-auto max-w-[92vw]">
          <div className="bg-red-950/95 border border-red-500 text-red-200 px-4 py-2 rounded-xl font-orbitron font-black text-xs md:text-sm tracking-widest flex items-center space-x-2.5 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
            <span>CRITICAL HULL INTEGRITY ({healthPct}%) • STRUCTURAL DAMAGE!</span>
          </div>
        </div>
      )}

      {/* PROMPT FOR 'PRESS E' AND 'SPACEBAR' ANCHORED AT BOTTOM (DOES NOT BLOCK VIEWPORT) */}
      {nearInteractive && !isDrillingSample && !dangerAlert && (
        <div className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-auto max-w-[92vw] transition-all">
          <div className="glass-panel px-4 py-2 rounded-xl text-xs md:text-sm font-orbitron font-black text-[#E67E22] border-2 border-[#E67E22] bg-black/90 shadow-[0_0_25px_rgba(230,126,34,0.7)] flex items-center space-x-2.5 animate-bounce">
            <span className="px-2 py-0.5 rounded bg-[#E67E22] text-black font-black text-xs">
              E
            </span>
            <span className="tracking-wider">PRESS 'E' OR TAP ACTION TO INTERACT</span>
            <span className="text-white/40 text-xs hidden sm:inline">|</span>
            <span className="px-2 py-0.5 rounded bg-[#4DD0E1]/30 border border-[#4DD0E1]/60 text-[#4DD0E1] font-mono text-[10px] hidden sm:inline">
              SPACE
            </span>
            <span className="text-[#4DD0E1] text-xs font-bold hidden sm:inline">
              RADAR
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
