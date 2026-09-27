import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Gauge,
  Compass,
  Hammer,
  Radio,
  Wrench,
  BookOpen,
  Camera,
  ChevronRight,
  ChevronLeft,
  Rocket,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface HudDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMission: () => void;
}

interface HudItemInfo {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  screenPosition: string;
  keyboardShortcut?: string;
  keyRule: string;
}

const HUD_ITEMS: HudItemInfo[] = [
  {
    id: 'hull',
    title: 'HULL INTEGRITY (100 / 100)',
    subtitle: 'Rover Structural Health & Armor Status',
    icon: <ShieldCheck className="w-6 h-6 text-[#2ECC71]" />,
    color: '#2ECC71',
    screenPosition: 'Bottom Left HUD Box',
    description:
      'Your rover begins with 100/100 Hull Integrity. When you hit rocky boulders or drive into hazards, your hull takes kinetic structural damage and decreases. If your hull integrity reaches 0/100, mission control triggers Game Over!',
    keyRule: 'Keep above 0 HP! Steer around rocks to preserve your hull.',
  },
  {
    id: 'battery',
    title: 'BATTERY & SOLAR PANELS',
    subtitle: 'Electrical Power Storage & Solar Absorption',
    icon: <Zap className="w-6 h-6 text-[#F1C40F]" />,
    color: '#F1C40F',
    screenPosition: 'Bottom Left Telemetry Panel',
    keyboardShortcut: 'Press [R] to Clean Dust',
    description:
      'Driving drains battery power, while Martian sunlight continuously recharges your cells. As you explore, red dust accumulates on your solar panels. Use the Solar Dust Purge mini-activity to wipe panels clean and restore 100% solar efficiency.',
    keyRule: 'Clean dust with [R] when efficiency drops below 70%.',
  },
  {
    id: 'speed',
    title: 'SPEEDOMETER & TERRAIN TRACTION',
    subtitle: 'Velocity Telemetry & Biome Drift Physics',
    icon: <Gauge className="w-6 h-6 text-[#4DD0E1]" />,
    color: '#4DD0E1',
    screenPosition: 'Bottom Left Speed Readout',
    keyboardShortcut: 'Drive with W / A / S / D or Arrows',
    description:
      'Displays your current travel speed in km/h. Different Martian biomes feature unique traction physics: basalt canyon provides firm grip, dunes cause loose sand drag, and ice caps cause momentum sliding.',
    keyRule: 'Upgrade Dune Treads in the workshop for superior sand traction.',
  },
  {
    id: 'radar',
    title: 'MINI-RADAR & WAYPOINT COMPASS',
    subtitle: 'Top-Down Area Scanner & Target Nav',
    icon: <Compass className="w-6 h-6 text-[#00E5FF]" />,
    color: '#00E5FF',
    screenPosition: 'Top Left Radar Canvas',
    keyboardShortcut: 'Press [Spacebar] to Pulse Radar',
    description:
      'The mini-radar shows your rover position (cyan chevron), science stations (yellow markers), mineral samples (green nodes), relay towers, and hazard zones. Emitting a radar pulse expands your survey radius and grants +5 Science Points.',
    keyRule: 'Use radar pulses to locate buried ice sheets in Level 2!',
  },
  {
    id: 'drill',
    title: 'HAMMER DRILL ARM (SAMPLE EXTRACTION)',
    subtitle: 'Geological Coring & Coin Extraction',
    icon: <Hammer className="w-6 h-6 text-[#E67E22]" />,
    color: '#E67E22',
    screenPosition: 'Interactive Prompt & Mechanical Arm',
    keyboardShortcut: 'Press [E] Near Minerals',
    description:
      'When you drive near target rocks and mineral outcrops, an [INTERACT] prompt appears. Press [E] to deploy the 1-second robotic hammer drill arm. Successfully coring a sample awards +120 Coins and +60 Science Points!',
    keyRule: 'Collect all required samples to complete the mission level.',
  },
  {
    id: 'radio',
    title: 'RADIO COMMUNICATOR & OBJECTIVES',
    subtitle: 'Ares Base Telemetry & Current Task',
    icon: <Radio className="w-6 h-6 text-[#9B59B6]" />,
    color: '#9B59B6',
    screenPosition: 'Top Center Objective Bar',
    description:
      'Displays your active mission objective (e.g. "Drive toward Science Station"). Subtitles and radio updates appear here during your exploration to guide your next steps without disruptive audio voice clutter.',
    keyRule: 'Follow the yellow marker on your compass to reach goals.',
  },
  {
    id: 'garage',
    title: 'WORKSHOP GARAGE & UPGRADES',
    subtitle: 'Chassis Tuning & Custom Cosmetics',
    icon: <Wrench className="w-6 h-6 text-[#FF9800]" />,
    color: '#FF9800',
    screenPosition: 'Top Right Action Bar',
    description:
      'Open the Garage to tune your rover specs: upgrade maximum hull armor (+20 HP per rank), increase top speed, improve battery cells, or purchase custom paint skins, tires, headlight colors, and plasma trails using your earned coins!',
    keyRule: 'Spend coins to unlock higher Commander Evolution Tiers.',
  },
  {
    id: 'camera',
    title: 'CAMERA MODE (CHASE / TOP-DOWN / MAST)',
    subtitle: 'Multiple Viewpoint Perspectives',
    icon: <Camera className="w-6 h-6 text-[#4DD0E1]" />,
    color: '#4DD0E1',
    screenPosition: 'Top Right Camera Selector',
    keyboardShortcut: 'Press [V] to Cycle Views',
    description:
      'Switch dynamically between 3 distinct perspectives: 3D Isometric Chase Camera (best for general driving), Top-Down Tactical Camera (great for precision navigation), and First-Person Mast Camera (realistic driver cockpit view).',
    keyRule: 'Press [V] anytime to change your camera angle.',
  },
  {
    id: 'science',
    title: 'SCIENCE RESEARCH NOTEBOOK',
    subtitle: 'Planetary Geology & Mineral Discoveries',
    icon: <BookOpen className="w-6 h-6 text-[#2ECC71]" />,
    color: '#2ECC71',
    screenPosition: 'Top Right Notebook Icon',
    description:
      'Every core sample, subsurface ice glacier, and planetary anomaly you scan is automatically documented in your Science Log with coordinates, surface temperatures, chemical formulas, and astrobiological significance.',
    keyRule: 'Review your catalog to inspect discoveries from all 5 biomes.',
  },
];

export const HudDemoModal: React.FC<HudDemoModalProps> = ({
  isOpen,
  onClose,
  onStartMission,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const currentItem = HUD_ITEMS[currentIndex];

  const handleNext = () => {
    if (currentIndex < HUD_ITEMS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-3 sm:p-5 backdrop-blur-lg select-none overflow-y-auto animate-fade-in">
      <div className="max-w-2xl w-full glass-panel rounded-3xl p-5 sm:p-7 border-2 border-[#4DD0E1] shadow-[0_0_90px_rgba(77,208,225,0.4)] flex flex-col justify-between my-auto max-h-[96vh]">
        
        {/* Terminal Header */}
        <div className="text-center border-b border-[#4DD0E1]/30 pb-3 mb-3">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-[#4DD0E1]/15 border border-[#4DD0E1]/40 mb-1.5">
            <Eye className="w-3.5 h-3.5 text-[#4DD0E1]" />
            <span className="text-[10px] sm:text-xs font-orbitron font-bold text-[#4DD0E1] tracking-widest uppercase">
              HUD & SCREEN INTERFACE DEMO • ITEM {currentIndex + 1} OF {HUD_ITEMS.length}
            </span>
          </div>

          <h2 className="font-orbitron font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#4DD0E1] to-[#E67E22] tracking-wide">
            WHAT EACH ITEM ON SCREEN MEANS
          </h2>
          <p className="text-xs text-white/70 mt-0.5 max-w-lg mx-auto">
            A quick walkthrough of all rover telemetry meters, instruments, and buttons before launching Map 1.
          </p>
        </div>

        {/* Thumbnail Selector Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 mb-3">
          {HUD_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer text-center ${
                currentIndex === idx
                  ? 'border-[#4DD0E1] bg-[#4DD0E1]/25 scale-105 shadow-[0_0_15px_rgba(77,208,225,0.4)]'
                  : 'border-white/10 bg-black/40 hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
              title={item.title}
            >
              <div className="scale-75 mb-0.5">{item.icon}</div>
              <span className="text-[9px] font-orbitron font-bold text-white/90 truncate w-full">
                #{idx + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Focused Card Display */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/70 border border-[#4DD0E1]/50 text-left space-y-3 shadow-inner my-auto">
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${currentItem.color}25`, border: `2px solid ${currentItem.color}` }}
              >
                {currentItem.icon}
              </div>
              <div>
                <h3 className="font-orbitron font-black text-base sm:text-lg text-white">
                  {currentItem.title}
                </h3>
                <span className="text-xs text-white/70 block">
                  {currentItem.subtitle}
                </span>
              </div>
            </div>

            <span
              className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded-full uppercase border hidden sm:inline-block"
              style={{ borderColor: currentItem.color, color: currentItem.color, backgroundColor: `${currentItem.color}15` }}
            >
              {currentItem.screenPosition}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-rajdhani font-semibold">
            {currentItem.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
            {currentItem.keyboardShortcut && (
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-300 font-mono flex items-center space-x-1.5">
                <span className="text-white/60 text-[10px] uppercase font-orbitron">KEYBOARD:</span>
                <strong className="text-white">{currentItem.keyboardShortcut}</strong>
              </div>
            )}
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span><strong>RULE:</strong> {currentItem.keyRule}</span>
            </div>
          </div>

        </div>

        {/* Carousel Controls & Launch Button */}
        <div className="pt-3 border-t border-[#4DD0E1]/30 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs flex items-center space-x-1 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">PREV</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === HUD_ITEMS.length - 1}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs flex items-center space-x-1 disabled:opacity-30 cursor-pointer"
            >
              <span className="hidden sm:inline">NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs cursor-pointer"
            >
              CLOSE GUIDE
            </button>

            <button
              type="button"
              onClick={onStartMission}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black font-orbitron font-black text-xs sm:text-sm tracking-wider shadow-lg hover:brightness-110 active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <Rocket className="w-4 h-4" />
              <span>LAUNCH MAP 1</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
