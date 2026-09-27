import React, { useState } from 'react';
import {
  BookOpen,
  X,
  MapPin,
  Thermometer,
  Sparkles,
  Atom,
  Search,
  Filter,
  Microscope,
  Compass,
} from 'lucide-react';
import { DiscoveryItem } from '../types';

interface ScienceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  discoveries: DiscoveryItem[];
}

export const ScienceLogModal: React.FC<ScienceLogModalProps> = ({
  isOpen,
  onClose,
  discoveries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filteredDiscoveries = discoveries.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.title.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q) ||
      (d.chemicalFormula && d.chemicalFormula.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    return d.category?.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md select-none animate-fade-in">
      <div className="max-w-3xl w-full h-[620px] max-h-[94vh] glass-panel rounded-3xl p-5 sm:p-7 border-2 border-[#2ECC71]/80 flex flex-col justify-between shadow-[0_0_60px_rgba(46,204,113,0.3)]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#2ECC71]/30 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2ECC71]/20 border-2 border-[#2ECC71] text-[#2ECC71] flex items-center justify-center shadow-[0_0_20px_rgba(46,204,113,0.4)]">
              <Microscope className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40 uppercase">
                  NASA / ESA MARS FIELD CATALOG
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">
                  EXPEDITION SPECTRAL DATABASE
                </span>
              </div>
              <h2 className="font-orbitron font-black text-xl text-white tracking-wide mt-0.5">
                MARS SCIENCE LOGBOOK & TELEMETRY
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

        {/* Telemetry Quick Bar */}
        <div className="grid grid-cols-3 gap-2 my-3 text-center">
          <div className="p-2 rounded-xl bg-black/60 border border-[#2ECC71]/40">
            <span className="text-[10px] text-white/60 font-orbitron block">SPECIMENS CATALOGED</span>
            <strong className="text-base font-orbitron font-bold text-[#2ECC71]">
              {discoveries.length} Samples
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-black/60 border border-cyan-400/40">
            <span className="text-[10px] text-white/60 font-orbitron block">ASTROBIOLOGY RATINGS</span>
            <strong className="text-base font-orbitron font-bold text-cyan-300">
              {discoveries.filter((d) => d.astroPotential?.includes('HIGH') || d.astroPotential?.includes('EXTREME') || d.astroPotential?.includes('MAXIMUM')).length} Viable Sites
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-black/60 border border-amber-400/40">
            <span className="text-[10px] text-white/60 font-orbitron block">SPECTRAL COVERAGE</span>
            <strong className="text-base font-orbitron font-bold text-amber-300">
              {discoveries.length > 0 ? Math.min(100, discoveries.length * 15) : 0}% Mars Surveyed
            </strong>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discoveries by mineral name, chemical formula, or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/60 border border-[#2ECC71]/30 font-orbitron text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#2ECC71]"
          />
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar text-left">
          {filteredDiscoveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-[#F4F7FA]/60">
              <BookOpen className="w-12 h-12 text-white/20" />
              <p className="text-sm italic font-orbitron">
                {discoveries.length === 0
                  ? 'No scientific discoveries cataloged yet.'
                  : 'No discoveries match your search query.'}
              </p>
              <p className="text-xs text-white/40 max-w-sm">
                Drive across Mars to scan minerals, subsurface ice glaciers, geothermal vents, and field relays to record discoveries.
              </p>
            </div>
          ) : (
            filteredDiscoveries.map((d, i) => (
              <div
                key={i}
                className="glass-panel p-4 rounded-2xl border border-[#2ECC71]/40 space-y-2 text-xs shadow-sm hover:border-[#2ECC71] transition-all bg-black/60"
              >
                {/* Title & Coordinates Row */}
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-orbitron font-black text-sm text-[#2ECC71]">
                      #{i + 1} {d.title}
                    </span>
                    {d.category && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#2ECC71]/15 text-[#2ECC71] font-orbitron font-bold border border-[#2ECC71]/40 uppercase">
                        {d.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-[#4DD0E1] font-mono">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{d.coords}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-white/70">
                      <Thermometer className="w-3.5 h-3.5 text-[#FF5722]" />
                      <span>{d.temp}</span>
                    </span>
                  </div>
                </div>

                {/* Chemical Formula & Astrobiology Row */}
                {(d.chemicalFormula || d.astroPotential || d.density) && (
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-0.5">
                    {d.chemicalFormula && (
                      <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 flex items-center space-x-1.5">
                        <Atom className="w-3.5 h-3.5 text-cyan-400" />
                        <span><strong>Formula:</strong> {d.chemicalFormula}</span>
                      </div>
                    )}
                    {d.density && (
                      <div className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-400/40 text-purple-300">
                        <span><strong>Density:</strong> {d.density}</span>
                      </div>
                    )}
                    {d.astroPotential && (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span><strong>Astrobiology:</strong> {d.astroPotential}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description Narrative */}
                <p className="text-[#F4F7FA]/90 leading-relaxed font-sans text-xs">
                  {d.desc}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#4DD0E1]/30 pt-3 flex justify-between items-center text-xs text-[#F4F7FA]/70">
          <span className="font-orbitron">
            TOTAL CATALOGED: <strong className="text-[#2ECC71] font-bold">{discoveries.length}</strong> SPECIMENS
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#9E2A1B] font-orbitron font-bold text-xs text-white hover:bg-[#E67E22] transition-all cursor-pointer"
          >
            CLOSE LOG
          </button>
        </div>
      </div>
    </div>
  );
};
