import React from 'react';
import { BookOpen, X, MapPin, Thermometer } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="max-w-2xl w-full h-[520px] glass-panel rounded-2xl p-6 border border-[#2ECC71] flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#4DD0E1]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#2ECC71]">
            <BookOpen className="w-5 h-5" />
            <h2 className="font-orbitron font-bold text-base md:text-lg">
              MARS SCIENCE LOGBOOK & TELEMETRY
            </h2>
          </div>
          <button onClick={onClose} className="text-[#F4F7FA]/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto space-y-3 my-3 pr-2">
          {discoveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-[#F4F7FA]/60">
              <BookOpen className="w-12 h-12 text-white/20" />
              <p className="text-sm italic">
                No scientific discoveries cataloged yet.
              </p>
              <p className="text-xs text-white/40 max-w-sm">
                Drive across Mars to scan minerals, subsurface ice glaciers, geothermal vents, and field relays to record discoveries.
              </p>
            </div>
          ) : (
            discoveries.map((d, i) => (
              <div
                key={i}
                className="glass-panel p-3.5 rounded-xl border border-[#2ECC71]/40 space-y-1.5 text-xs shadow-sm hover:border-[#2ECC71] transition-all"
              >
                <div className="flex justify-between items-center font-orbitron font-bold text-[#2ECC71]">
                  <span>#{i + 1} {d.title}</span>
                  <div className="flex items-center space-x-3 text-[11px] text-[#4DD0E1]">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{d.coords}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-white/70">
                      <Thermometer className="w-3 h-3 text-[#FF5722]" />
                      <span>{d.temp}</span>
                    </span>
                  </div>
                </div>
                <p className="text-[#F4F7FA]/80 leading-relaxed">{d.desc}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#4DD0E1]/30 pt-3 flex justify-between items-center text-xs text-[#F4F7FA]/70">
          <span>
            TOTAL CATALOGED DISCOVERIES: <strong className="text-[#2ECC71] font-orbitron font-bold">{discoveries.length}</strong>
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
