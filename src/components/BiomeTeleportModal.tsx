import React from 'react';
import {
  Zap,
  Globe,
  Flame,
  Snowflake,
  Mountain,
  Compass,
  X,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { BiomeKey } from '../types';

interface BiomeOption {
  levelNum: number;
  biome: BiomeKey;
  name: string;
  scientificName: string;
  coords: string;
  desc: string;
  icon: React.ReactNode;
  accentColor: string;
  isFreeRoam?: boolean;
}

const BIOME_DESTINATIONS: BiomeOption[] = [
  {
    levelNum: 1,
    biome: 'basalt',
    name: 'Valles Marineris',
    scientificName: 'Melas Chasma Basalt Bedrock',
    coords: '9.8°S, 76.4°W',
    desc: 'Primordial Noachian canyon floor with olivine basalt bedrock and deep rift chasms.',
    icon: <Mountain className="w-5 h-5 text-[#9E2A1B]" />,
    accentColor: '#9E2A1B',
  },
  {
    levelNum: 2,
    biome: 'dunes',
    name: 'Jezero Crater',
    scientificName: 'Neretva Vallis Paleolake Delta',
    coords: '18.38°N, 77.58°E',
    desc: 'Ancient lacustrine riverbed delta with barchan regolith sand dunes and subsurface ice.',
    icon: <Compass className="w-5 h-5 text-[#E67E22]" />,
    accentColor: '#E67E22',
  },
  {
    levelNum: 3,
    biome: 'ice',
    name: 'Planum Boreum',
    scientificName: 'Chasma Boreale Cryosphere Permafrost',
    coords: '84.0°N, 0.0°E',
    desc: 'Basal cryospheric water ice sheets, sublimation crevasses, and geothermal hydrothermal vents.',
    icon: <Snowflake className="w-5 h-5 text-[#4DD0E1]" />,
    accentColor: '#4DD0E1',
  },
  {
    levelNum: 4,
    biome: 'lava',
    name: 'Cerberus Fossae',
    scientificName: 'Athabasca Valles Fissure Graben',
    coords: '10.2°N, 157.0°E',
    desc: 'Active tectonic volcanic fissure grabens, boiling magma lakes, and brittle basalt causeways.',
    icon: <Flame className="w-5 h-5 text-[#FF3D00]" />,
    accentColor: '#FF3D00',
  },
  {
    levelNum: 5,
    biome: 'summit',
    name: 'Olympus Mons',
    scientificName: 'Apex Caldera & Solar Aureole',
    coords: '18.65°N, 226.2°E',
    desc: '21.2 km altitude shield volcano caldera rim with ultra-low atmospheric pressure and deep space uplink.',
    icon: <Globe className="w-5 h-5 text-[#7E57C2]" />,
    accentColor: '#7E57C2',
  },
  {
    levelNum: 0,
    biome: 'basalt',
    name: 'Mars Free Roam',
    scientificName: 'Open Planetary Expanse & Survey Grid',
    coords: 'PLANETARY WIDE (4.4km²)',
    desc: 'Unrestricted open-world Martian terrain packed with 10+ drillable mineral nodes and materials.',
    icon: <Zap className="w-5 h-5 text-[#F1C40F]" />,
    accentColor: '#F1C40F',
    isFreeRoam: true,
  },
];

interface BiomeTeleportModalProps {
  isOpen: boolean;
  currentLevelNum: number;
  isFreeRoamMode: boolean;
  onClose: () => void;
  onTeleport: (levelNum: number, isFreeRoam?: boolean) => void;
}

export const BiomeTeleportModal: React.FC<BiomeTeleportModalProps> = ({
  isOpen,
  currentLevelNum,
  isFreeRoamMode,
  onClose,
  onTeleport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md select-none animate-fade-in">
      <div className="max-w-2xl w-full glass-panel rounded-3xl p-5 sm:p-6 border-2 border-amber-400/90 shadow-[0_0_60px_rgba(241,196,15,0.35)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-amber-400/30 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(241,196,15,0.4)]">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                  A.R.E.S. QUANTUM WARP MATRIX
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  CLEARANCE VERIFIED
                </span>
              </div>
              <h2 className="font-orbitron font-black text-xl text-white tracking-wide mt-0.5">
                PLANETARY BIOME TELEPORTER
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-white/70 mb-3">
          As authorized commander of the <strong className="text-amber-300 font-orbitron">A.R.E.S.</strong> protocol, you have direct quantum clearance to warp anywhere on the Martian planetary surface:
        </p>

        {/* Biomes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 custom-scrollbar">
          {BIOME_DESTINATIONS.map((dest) => {
            const isCurrent =
              dest.isFreeRoam ? isFreeRoamMode : (!isFreeRoamMode && currentLevelNum === dest.levelNum);

            return (
              <div
                key={dest.name}
                onClick={() => {
                  onTeleport(dest.levelNum, dest.isFreeRoam);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_25px_rgba(241,196,15,0.25)]'
                    : 'border-white/15 bg-black/60 hover:border-amber-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="p-2 rounded-xl bg-white/5 border flex-shrink-0"
                      style={{ borderColor: `${dest.accentColor}66` }}
                    >
                      {dest.icon}
                    </div>
                    <div>
                      <h3 className="font-orbitron font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                        {dest.name}
                      </h3>
                      <span className="text-[10px] font-mono text-white/50 block truncate max-w-[170px]">
                        {dest.coords}
                      </span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center space-x-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>HERE</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-orbitron font-bold px-2 py-0.5 rounded bg-white/10 text-white/60 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                      WARP
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-orbitron font-semibold text-amber-200/90 mb-1">
                  {dest.scientificName}
                </div>
                <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                  {dest.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Warning / Telemetry */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-orbitron text-white/60">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Quantum entanglement link stable • Zero dust delay</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
