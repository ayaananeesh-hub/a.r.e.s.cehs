import React from 'react';
import { Palette, X, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { CustomizationCatalog, RoverCustomization } from '../types';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CustomizationCatalog;
  customization: RoverCustomization;
  sciencePoints: number;
  unlockedSkins: string[];
  unlockedWheels: string[];
  unlockedLights: string[];
  unlockedTrails: string[];
  onEquip: (category: keyof RoverCustomization, id: string) => void;
  onBuy: (category: keyof RoverCustomization, id: string, cost: number) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  catalog,
  customization,
  sciencePoints,
  unlockedSkins,
  unlockedWheels,
  unlockedLights,
  unlockedTrails,
  onEquip,
  onBuy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="max-w-3xl w-full max-h-[90vh] glass-panel rounded-2xl p-6 border-2 border-[#F1C40F] flex flex-col justify-between space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#F1C40F]/30 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#F1C40F]/20 text-[#F1C40F] border border-[#F1C40F]/40">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base md:text-lg text-[#F1C40F]">
                ROVER CUSTOMIZATION GARAGE
              </h2>
              <p className="text-xs text-[#F4F7FA]/70">
                Earn Science Points (SP) from missions & research to unlock custom cosmetics.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass-panel px-3 py-1.5 rounded-xl border border-[#F1C40F]/50 flex items-center space-x-2">
              <span className="text-xs text-[#F4F7FA]/70 font-orbitron">SCIENCE PTS:</span>
              <strong className="text-[#F1C40F] font-orbitron font-black text-sm">{sciencePoints} SP</strong>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 max-h-[60vh]">
          {/* Skins */}
          <div className="glass-panel p-4 rounded-xl border border-[#4DD0E1]/30 space-y-3">
            <h3 className="font-orbitron font-bold text-xs text-[#4DD0E1] flex items-center justify-between">
              <span>🚀 CHASSIS PAINT SKINS</span>
              <span className="text-[10px] text-[#F4F7FA]/60">BODY COLOR</span>
            </h3>
            <div className="space-y-2">
              {catalog.skins.map((s) => {
                const isUnlocked = unlockedSkins.includes(s.id);
                const isSelected = customization.skin === s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-[#F1C40F] bg-[#F1C40F]/15 shadow-sm'
                        : 'border-white/10 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-bold text-white">{s.name}</span>
                    </div>
                    <div>
                      {isSelected ? (
                        <span className="text-[#F1C40F] font-orbitron font-bold text-xs flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => onEquip('skin', s.id)}
                          className="px-3 py-1 rounded-lg bg-[#4DD0E1] text-black font-orbitron font-bold text-[11px] hover:bg-[#2ECC71] cursor-pointer"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuy('skin', s.id, s.cost)}
                          disabled={sciencePoints < s.cost}
                          className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                            sciencePoints >= s.cost
                              ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                              : 'bg-gray-700 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>UNLOCK ({s.cost} SP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wheels */}
          <div className="glass-panel p-4 rounded-xl border border-[#4DD0E1]/30 space-y-3">
            <h3 className="font-orbitron font-bold text-xs text-[#4DD0E1] flex items-center justify-between">
              <span>🛞 WHEEL & RIM STYLES</span>
              <span className="text-[10px] text-[#F4F7FA]/60">TIRE ACCENTS</span>
            </h3>
            <div className="space-y-2">
              {catalog.wheels.map((w) => {
                const isUnlocked = unlockedWheels.includes(w.id);
                const isSelected = customization.wheel === w.id;
                return (
                  <div
                    key={w.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-[#F1C40F] bg-[#F1C40F]/15 shadow-sm'
                        : 'border-white/10 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-4 h-4 rounded border border-white/40 shadow"
                        style={{ backgroundColor: w.rimColor }}
                      />
                      <span className="font-bold text-white">{w.name}</span>
                    </div>
                    <div>
                      {isSelected ? (
                        <span className="text-[#F1C40F] font-orbitron font-bold text-xs flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => onEquip('wheel', w.id)}
                          className="px-3 py-1 rounded-lg bg-[#4DD0E1] text-black font-orbitron font-bold text-[11px] hover:bg-[#2ECC71] cursor-pointer"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuy('wheel', w.id, w.cost)}
                          disabled={sciencePoints < w.cost}
                          className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                            sciencePoints >= w.cost
                              ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                              : 'bg-gray-700 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>UNLOCK ({w.cost} SP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lights */}
          <div className="glass-panel p-4 rounded-xl border border-[#4DD0E1]/30 space-y-3">
            <h3 className="font-orbitron font-bold text-xs text-[#4DD0E1] flex items-center justify-between">
              <span>💡 LED HEADLIGHT BEAMS</span>
              <span className="text-[10px] text-[#F4F7FA]/60">LIGHT CONE</span>
            </h3>
            <div className="space-y-2">
              {catalog.lights.map((l) => {
                const isUnlocked = unlockedLights.includes(l.id);
                const isSelected = customization.light === l.id;
                return (
                  <div
                    key={l.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-[#F1C40F] bg-[#F1C40F]/15 shadow-sm'
                        : 'border-white/10 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="font-bold text-white">{l.name}</span>
                    </div>
                    <div>
                      {isSelected ? (
                        <span className="text-[#F1C40F] font-orbitron font-bold text-xs flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => onEquip('light', l.id)}
                          className="px-3 py-1 rounded-lg bg-[#4DD0E1] text-black font-orbitron font-bold text-[11px] hover:bg-[#2ECC71] cursor-pointer"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuy('light', l.id, l.cost)}
                          disabled={sciencePoints < l.cost}
                          className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                            sciencePoints >= l.cost
                              ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                              : 'bg-gray-700 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>UNLOCK ({l.cost} SP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trails */}
          <div className="glass-panel p-4 rounded-xl border border-[#4DD0E1]/30 space-y-3">
            <h3 className="font-orbitron font-bold text-xs text-[#4DD0E1] flex items-center justify-between">
              <span>✨ TREAD PARTICLE TRAILS</span>
              <span className="text-[10px] text-[#F4F7FA]/60">DRIVE EFFECT</span>
            </h3>
            <div className="space-y-2">
              {catalog.trails.map((t) => {
                const isUnlocked = unlockedTrails.includes(t.id);
                const isSelected = customization.trail === t.id;
                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-[#F1C40F] bg-[#F1C40F]/15 shadow-sm'
                        : 'border-white/10 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-white/70" />
                      <span className="font-bold text-white">{t.name}</span>
                    </div>
                    <div>
                      {isSelected ? (
                        <span className="text-[#F1C40F] font-orbitron font-bold text-xs flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => onEquip('trail', t.id)}
                          className="px-3 py-1 rounded-lg bg-[#4DD0E1] text-black font-orbitron font-bold text-[11px] hover:bg-[#2ECC71] cursor-pointer"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuy('trail', t.id, t.cost)}
                          disabled={sciencePoints < t.cost}
                          className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                            sciencePoints >= t.cost
                              ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                              : 'bg-gray-700 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>UNLOCK ({t.cost} SP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#F1C40F]/30 pt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-xs text-[#F4F7FA]/70">
            Equipped cosmetics render in real-time onto your exploration rover and minimap.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2ECC71] font-orbitron font-bold text-xs text-black hover:bg-[#4DD0E1] transition-all cursor-pointer shadow-lg"
          >
            CONFIRM & EXIT GARAGE 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
