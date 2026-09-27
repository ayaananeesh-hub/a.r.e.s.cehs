import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  ShoppingBag,
  Sparkles,
  Zap,
  Shield,
  BatteryCharging,
  Sun,
  Wrench,
  Coins,
  Award,
} from 'lucide-react';
import { CustomizationCatalog, RoverCustomization, RoverState } from '../types';
import { getTierForPointsSpent } from '../utils/characterProfiles';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CustomizationCatalog;
  customization: RoverCustomization;
  sciencePoints: number;
  coins?: number;
  pointsSpent?: number;
  rover?: RoverState;
  unlockedSkins: string[];
  unlockedWheels: string[];
  unlockedLights: string[];
  unlockedTrails: string[];
  onEquip: (category: keyof RoverCustomization, id: string) => void;
  onBuy: (category: keyof RoverCustomization, id: string, cost: number) => void;
  onTuneRover?: (type: 'speed' | 'armor' | 'battery' | 'solar' | 'repair', cost: number) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  catalog,
  customization,
  sciencePoints,
  coins = 0,
  pointsSpent = 0,
  rover,
  unlockedSkins,
  unlockedWheels,
  unlockedLights,
  unlockedTrails,
  onEquip,
  onBuy,
  onTuneRover,
}) => {
  const [activeTab, setActiveTab] = useState<'cosmetics' | 'tuning'>('cosmetics');

  if (!isOpen) return null;

  const totalSpent = pointsSpent ?? rover?.pointsSpent ?? 0;
  const currentCoins = coins ?? rover?.coins ?? rover?.dust ?? 0;
  const tier = getTierForPointsSpent(totalSpent);

  const tunedSpeed = rover?.tunedSpeedLevel ?? 0;
  const tunedArmor = rover?.tunedArmorLevel ?? 0;
  const tunedBattery = rover?.tunedBatteryLevel ?? 0;
  const tunedSolar = rover?.tunedSolarLevel ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="max-w-4xl w-full max-h-[92vh] glass-panel rounded-2xl p-5 sm:p-6 border-2 border-[#F1C40F] flex flex-col justify-between space-y-4 shadow-2xl my-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#F1C40F]/30 pb-3 gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#F1C40F]/20 text-[#F1C40F] border border-[#F1C40F]/40 flex-shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-orbitron font-bold text-base sm:text-lg text-[#F1C40F]">
                  ARES WORKSHOP & TECH LAB
                </h2>
                <span
                  className="text-[9px] px-2 py-0.5 rounded font-orbitron font-bold border"
                  style={{ borderColor: tier.color, color: tier.color, backgroundColor: `${tier.color}20` }}
                >
                  {tier.badge}
                </span>
              </div>
              <p className="text-xs text-[#F4F7FA]/70">
                Spend points on custom cosmetics and physical rover tech tuning. Rover stats adapt with points invested!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
            <div className="glass-panel px-3 py-1.5 rounded-xl border border-[#F1C40F]/50 flex items-center space-x-2 text-xs font-orbitron bg-black/50">
              <Coins className="w-4 h-4 text-[#F1C40F]" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-[#F4F7FA]/60">POINTS / COINS:</span>
                <strong className="text-[#F1C40F] font-bold">{currentCoins.toLocaleString()}</strong>
              </div>
            </div>

            <div className="glass-panel px-3 py-1.5 rounded-xl border border-white/20 flex items-center space-x-2 text-xs font-orbitron bg-black/50">
              <Award className="w-4 h-4 text-[#E67E22]" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-white/50">POINTS SPENT:</span>
                <strong className="text-[#FF9800] font-bold">{totalSpent.toLocaleString()}</strong>
              </div>
            </div>

            <button onClick={onClose} className="text-white/70 hover:text-white p-1 cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('cosmetics')}
            className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'cosmetics'
                ? 'bg-[#F1C40F] text-black shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>COSMETIC SKINS & STYLES</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tuning')}
            className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'tuning'
                ? 'bg-[#4DD0E1] text-black shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>PERFORMANCE TECH TUNING</span>
            {totalSpent > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/30 font-mono font-bold">
                Tier {tier.tierLevel}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: COSMETICS */}
        {activeTab === 'cosmetics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 max-h-[55vh]">
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
                  const canAfford = currentCoins >= s.cost || sciencePoints >= s.cost;

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
                            disabled={!canAfford}
                            className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                              canAfford
                                ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                                : 'bg-gray-700 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>UNLOCK ({s.cost} PTS)</span>
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
                  const canAfford = currentCoins >= w.cost || sciencePoints >= w.cost;

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
                            disabled={!canAfford}
                            className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                              canAfford
                                ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                                : 'bg-gray-700 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>UNLOCK ({w.cost} PTS)</span>
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
                <span>💡 HEADLIGHT COLOR SPECTRUM</span>
                <span className="text-[10px] text-[#F4F7FA]/60">BEAM TINT</span>
              </h3>
              <div className="space-y-2">
                {catalog.lights.map((l) => {
                  const isUnlocked = unlockedLights.includes(l.id);
                  const isSelected = customization.light === l.id;
                  const canAfford = currentCoins >= l.cost || sciencePoints >= l.cost;

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
                          className="w-4 h-4 rounded-full shadow-lg border border-white/50"
                          style={{
                            backgroundColor: l.color,
                            boxShadow: `0 0 8px ${l.color}`,
                          }}
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
                            disabled={!canAfford}
                            className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                              canAfford
                                ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                                : 'bg-gray-700 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>UNLOCK ({l.cost} PTS)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dust Trails */}
            <div className="glass-panel p-4 rounded-xl border border-[#4DD0E1]/30 space-y-3">
              <h3 className="font-orbitron font-bold text-xs text-[#4DD0E1] flex items-center justify-between">
                <span>✨ WHEEL DUST PARTICLES</span>
                <span className="text-[10px] text-[#F4F7FA]/60">EXHAUST PLUME</span>
              </h3>
              <div className="space-y-2">
                {catalog.trails.map((t) => {
                  const isUnlocked = unlockedTrails.includes(t.id);
                  const isSelected = customization.trail === t.id;
                  const canAfford = currentCoins >= t.cost || sciencePoints >= t.cost;

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
                        <Sparkles
                          className="w-4 h-4"
                          style={{
                            color: t.id === 'ion' ? '#4DD0E1' : t.id === 'plasma' ? '#FF5722' : '#E67E22',
                          }}
                        />
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
                            disabled={!canAfford}
                            className={`px-3 py-1 rounded-lg font-orbitron font-bold text-[11px] flex items-center space-x-1 ${
                              canAfford
                                ? 'bg-[#E67E22] text-black hover:bg-[#FF5722] cursor-pointer'
                                : 'bg-gray-700 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>UNLOCK ({t.cost} PTS)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERFORMANCE TECH TUNING (POINTS SPENT CHANGES ROVER STATS) */}
        {activeTab === 'tuning' && (
          <div className="space-y-4 overflow-y-auto pr-1 max-h-[55vh]">
            
            {/* Evolution Tier Banner */}
            <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-black/80 to-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
                 style={{ borderColor: tier.color }}>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-orbitron uppercase text-white/60">ROVER EVOLUTION STATUS:</span>
                  <span className="font-orbitron font-black text-sm" style={{ color: tier.color }}>
                    {tier.tierName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-orbitron font-bold bg-white/10 text-white">
                    TIER {tier.tierLevel}/5
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tier.perks.map((p, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-white/60 block font-orbitron">TOTAL POINTS INVESTED</span>
                <strong className="text-lg font-orbitron font-black text-[#FF9800]">
                  {totalSpent.toLocaleString()} PTS
                </strong>
              </div>
            </div>

            {/* Tech Upgrades Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Thruster Accelerator */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/15 bg-black/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-xs text-white">THRUSTER GEAR ACCELERATION</h4>
                    <p className="text-[10px] text-white/60">+10% Top Speed & Torque per level (Lvl {tunedSpeed}/5)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTuneRover && onTuneRover('speed', 100)}
                  disabled={currentCoins < 100 || tunedSpeed >= 5}
                  className="px-3 py-1.5 rounded-lg bg-[#E67E22] hover:bg-[#FF5722] disabled:opacity-30 disabled:cursor-not-allowed text-black font-orbitron font-bold text-[11px] cursor-pointer transition-all"
                >
                  {tunedSpeed >= 5 ? 'MAXED' : 'UPGRADE (-100)'}
                </button>
              </div>

              {/* 2. Titanium Armor Hull */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/15 bg-black/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-xs text-white">TITANIUM HULL ARMOR</h4>
                    <p className="text-[10px] text-white/60">+20 Max Health & instant 25 HP repair (Lvl {tunedArmor}/5)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTuneRover && onTuneRover('armor', 100)}
                  disabled={currentCoins < 100 || tunedArmor >= 5}
                  className="px-3 py-1.5 rounded-lg bg-[#2ECC71] hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-orbitron font-bold text-[11px] cursor-pointer transition-all"
                >
                  {tunedArmor >= 5 ? 'MAXED' : 'UPGRADE (-100)'}
                </button>
              </div>

              {/* 3. Auxiliary Lithium Battery */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/15 bg-black/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-xs text-white">LITHIUM POWERCELL CAPACITY</h4>
                    <p className="text-[10px] text-white/60">+25 Max Battery & slower power drain (Lvl {tunedBattery}/5)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTuneRover && onTuneRover('battery', 100)}
                  disabled={currentCoins < 100 || tunedBattery >= 5}
                  className="px-3 py-1.5 rounded-lg bg-[#4DD0E1] hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-orbitron font-bold text-[11px] cursor-pointer transition-all"
                >
                  {tunedBattery >= 5 ? 'MAXED' : 'UPGRADE (-100)'}
                </button>
              </div>

              {/* 4. Nano-Solar Coating */}
              <div className="glass-panel p-3.5 rounded-xl border border-white/15 bg-black/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-xs text-white">NANO-SOLAR COATING</h4>
                    <p className="text-[10px] text-white/60">+15% Solar efficiency & dust repellent (Lvl {tunedSolar}/5)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTuneRover && onTuneRover('solar', 100)}
                  disabled={currentCoins < 100 || tunedSolar >= 5}
                  className="px-3 py-1.5 rounded-lg bg-[#F1C40F] hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-black font-orbitron font-bold text-[11px] cursor-pointer transition-all"
                >
                  {tunedSolar >= 5 ? 'MAXED' : 'UPGRADE (-100)'}
                </button>
              </div>

              {/* 5. Field Emergency Service */}
              <div className="glass-panel p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex items-center justify-between sm:col-span-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-xs text-white">EMERGENCY FIELD REPAIR & DUST PURGE</h4>
                    <p className="text-[10px] text-white/60">Instantly restores +40 Chassis HP and wipes 100% solar dust</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTuneRover && onTuneRover('repair', 50)}
                  disabled={currentCoins < 50}
                  className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-orbitron font-bold text-[11px] cursor-pointer transition-all"
                >
                  PURGE & FIX (-50 PTS)
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#F1C40F]/30 pt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-xs text-[#F4F7FA]/70">
            {activeTab === 'cosmetics'
              ? 'Cosmetics render directly in 3D on your rover and minimap radar.'
              : 'All points used & spent are saved directly to your commander file.'}
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2ECC71] font-orbitron font-bold text-xs text-black hover:bg-[#4DD0E1] transition-all cursor-pointer shadow-lg"
          >
            CONFIRM & EXIT WORKSHOP 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
