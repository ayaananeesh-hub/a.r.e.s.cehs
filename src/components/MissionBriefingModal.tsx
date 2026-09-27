import React from 'react';
import {
  Rocket,
  Compass,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Play,
  Shield,
  Zap,
  Radio,
  Eye,
} from 'lucide-react';
import { LevelConfig } from '../types';

interface MissionBriefingModalProps {
  isOpen: boolean;
  levelNum: number;
  levelConfig: LevelConfig;
  onStartMission: () => void;
  onOpenHudDemo?: () => void;
}

interface LevelBriefingContent {
  headline: string;
  simpleGoal: string;
  whatToDo: string[];
  hazards: string;
  tips: string;
}

const LEVEL_BRIEFINGS: Record<number, LevelBriefingContent> = {
  1: {
    headline: 'BASALT CANYON • INITIAL ROVER RECON',
    simpleGoal: 'Drive your rover into the canyon, calibrate wheel transmissions, and extract rock samples.',
    whatToDo: [
      'Drive forward using W / A / S / D or Arrow Keys on your keyboard (or touch controls on mobile).',
      'Avoid large rocky boulders! Hitting rocks damages your Hull Integrity (starts at 100/100).',
      'Drive to the Tech Depot and press [E] to install Sand Dune Treads.',
      'Drive near basalt rock formations and press [E] to drill core samples (+120 Coins each!).',
    ],
    hazards: 'Volcanic rock boulders will damage your hull on impact. Steer around them!',
    tips: 'Press [Spacebar] to emit a radar pulse if you need to find target locations.',
  },
  2: {
    headline: 'DUNES OF UTOPIA • SUBSURFACE ICE HUNT',
    simpleGoal: 'Navigate loose sand dunes, locate buried permafrost glaciers with radar, and collect ice samples.',
    whatToDo: [
      'Loose dune sand slows down your rover. Your upgraded treads help you power through.',
      'Press [Spacebar] frequently to emit subsurface radar scans until an underground ice layer is detected.',
      'Reach the Science Station to calibrate the Subsurface Wave Synthesizer.',
      'Extract frozen permafrost core samples with [E] to earn research points.',
    ],
    hazards: 'Deep sand dunes cause wheel slip and reduced speed. Watch your battery level.',
    tips: 'If dust accumulates on your solar panels, press [R] to clean them and restore charging.',
  },
  3: {
    headline: 'ACID CAVES • VOLCANIC STORM SHELTER',
    simpleGoal: 'Survey acidic subterranean caves, deploy storm shielding, and transmit telemetry to Earth.',
    whatToDo: [
      'Navigate the tight rocky cavern corridors without hitting walls and boulders.',
      'Reach the outpost station to complete the Circuit Shielding alignment mini-game.',
      'Collect rare acid-leached mineral crystals using the robotic hammer drill [E].',
      'Reach the Communications Relay tower to send data back to mission control.',
    ],
    hazards: 'Narrow basalt canyon walls and jagged rock obstacles make driving tight. Take turns slowly.',
    tips: 'Press [H] to toggle headlights on and off for better visibility in dark cavern areas.',
  },
  4: {
    headline: 'VOLCANIC CALDERA • LAVA CHASM CROSSING',
    simpleGoal: 'Traverse molten magma rivers, build the basalt causeway bridge, and tap geothermal energy.',
    whatToDo: [
      'STAY ON SAFE BASALT PATHWAYS! Touching glowing orange lava will rapidly melt your hull.',
      'Drive to the bridge construction terminal and build the Lava Causeway Bridge.',
      'Cross over the secured bridge to the central magma island.',
      'Deploy the Geothermal Power Generator to harness infinite volcanic energy.',
    ],
    hazards: 'EXTREME HEAT HAZARD! Molten lava rivers drain your hull integrity and overheat the rover.',
    tips: 'Keep to the gray basalt paths and islands. Do not steer into glowing orange lava!',
  },
  5: {
    headline: 'OLYMPUS MONS SUMMIT • PERMANENT COLONY',
    simpleGoal: 'Climb the highest volcano in the Solar System, establish Colony Dome Alpha, and connect Earth.',
    whatToDo: [
      'Climb the mountain slopes toward the summit of Olympus Mons.',
      'Deploy the Deep Space Quantum Uplink to establish direct high-speed communications with Earth.',
      'Drill summit silicate minerals for final scientific analysis.',
      'Plant the human civilization flag and activate Colony Habitat Dome Alpha!',
    ],
    hazards: 'High altitude thin atmosphere and steep rocky boulders. Maintain steady steering.',
    tips: 'Complete all objectives to trigger the historic 10-Year Martian Epilogue!',
  },
  0: {
    headline: 'MARS FREE ROAM • OPEN PLANET EXPLORATION',
    simpleGoal: 'Drive across the open Martian frontier with no time limits or strict mission constraints.',
    whatToDo: [
      'Freely explore the vast Martian terrain, sand dunes, and rock fields.',
      'Test your rover upgrades, tuned speed, and custom skins/wheels.',
      'Collect scattered minerals and core samples at your own pace.',
      'Return to base or teleport to specific biomes whenever you wish.',
    ],
    hazards: 'Watch out for rocky obstacles. Maintain your hull integrity (100/100).',
    tips: 'Use the pause menu (P) anytime to save or return to the main menu.',
  },
};

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  isOpen,
  levelNum,
  levelConfig,
  onStartMission,
  onOpenHudDemo,
}) => {
  if (!isOpen) return null;

  const content = LEVEL_BRIEFINGS[levelNum] || LEVEL_BRIEFINGS[1];
  const isLevel1 = levelNum === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-3 sm:p-5 backdrop-blur-lg select-none overflow-y-auto animate-fade-in">
      <div className="max-w-xl w-full glass-panel rounded-3xl p-5 sm:p-7 border-2 border-[#4DD0E1]/80 shadow-[0_0_80px_rgba(77,208,225,0.35)] flex flex-col justify-between my-auto max-h-[96vh]">
        
        {/* Header Badge & Level Title */}
        <div className="text-center border-b border-[#4DD0E1]/30 pb-3 mb-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#4DD0E1]/15 border border-[#4DD0E1]/40 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#4DD0E1] animate-ping" />
            <span className="text-[10px] sm:text-xs font-orbitron font-bold text-[#4DD0E1] tracking-widest uppercase">
              {levelNum === 0 ? 'FREE ROAM MODE' : `MISSION BRIEFING • LEVEL ${levelNum} / 5`}
            </span>
          </div>

          <h2 className="font-orbitron font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#4DD0E1] to-[#E67E22] tracking-wide">
            {content.headline}
          </h2>

          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-md mx-auto font-rajdhani font-semibold">
            {content.simpleGoal}
          </p>
        </div>

        {/* Content Body: Easy & Simple "What To Do" */}
        <div className="space-y-3 my-auto py-1">
          
          {/* Simple What To Do Here Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-[#4DD0E1]/40 text-left space-y-2">
            <div className="flex items-center space-x-2 text-[#4DD0E1] font-orbitron font-bold text-xs uppercase">
              <Compass className="w-4 h-4" />
              <span>WHAT TO DO HERE (EASY GUIDE):</span>
            </div>

            <div className="space-y-1.5 pl-1">
              {content.whatToDo.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-white/90">
                  <span className="w-4 h-4 rounded-full bg-[#4DD0E1]/20 text-[#4DD0E1] font-orbitron font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hull Integrity & Hazard Warning */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start space-x-2.5 text-left text-xs text-amber-200">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-orbitron text-[11px] block uppercase">
                HULL INTEGRITY RULE (100 / 100 HP):
              </strong>
              <span className="text-white/80">
                Your rover starts with <strong className="text-[#2ECC71]">100/100 Hull Integrity</strong>. {content.hazards} If hull integrity reaches 0/100, Game Over!
              </span>
            </div>
          </div>

          {/* Quick Tip */}
          <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 flex items-center space-x-2 text-left text-xs text-blue-200">
            <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span><strong>Pro Tip:</strong> {content.tips}</span>
          </div>

        </div>

        {/* Buttons / Actions */}
        <div className="pt-3 border-t border-[#4DD0E1]/30 flex flex-col sm:flex-row gap-2.5">
          
          {/* Level 1 Extra Feature: Small Demo of Screen Items */}
          {isLevel1 && onOpenHudDemo && (
            <button
              type="button"
              onClick={onOpenHudDemo}
              className="py-2.5 px-4 rounded-xl bg-[#4DD0E1]/20 border border-[#4DD0E1] text-[#4DD0E1] hover:bg-[#4DD0E1] hover:text-black font-orbitron font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
            >
              <Eye className="w-4 h-4" />
              <span>SCREEN & HUD DEMO GUIDE</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartMission}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#2ECC71] via-[#4DD0E1] to-[#00E5FF] text-black font-orbitron font-black text-xs sm:text-sm tracking-wider shadow-[0_0_30px_rgba(77,208,225,0.5)] hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Rocket className="w-4 h-4" />
            <span>START MISSION • LAUNCH ROVER</span>
          </button>
        </div>

      </div>
    </div>
  );
};
