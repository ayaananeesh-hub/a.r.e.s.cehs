import React, { useState } from 'react';
import { Microscope, X } from 'lucide-react';

interface PhysicsLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhysicsLabModal: React.FC<PhysicsLabModalProps> = ({ isOpen, onClose }) => {
  const [gravity, setGravity] = useState<number>(0.38);
  const [biome, setBiome] = useState<string>('basalt');
  const [slope, setSlope] = useState<number>(18);

  if (!isOpen) return null;

  const frictionMap: Record<string, number> = {
    basalt: 0.92,
    dunes: 0.82,
    ice: 0.96,
    volcanic: 0.86,
    lava: 0.84,
    summit: 0.90,
  };

  const fCoeff = frictionMap[biome] || 0.88;
  const brakeDist = ((10 / (fCoeff * gravity)) * (1 + slope / 30)).toFixed(1);
  const powerDraw = (1.0 + (slope / 20) * gravity).toFixed(1);
  const isHighRisk = slope > 30 || (biome === 'ice' && slope > 15);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080F1E]/95 p-4 backdrop-blur-md">
      <div className="max-w-3xl w-full glass-panel rounded-2xl p-6 border border-[#E67E22] space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-[#4DD0E1]/30 pb-2">
          <div className="flex items-center space-x-2 text-[#E67E22]">
            <Microscope className="w-5 h-5" />
            <h2 className="font-orbitron font-bold text-lg">BIOME PHYSICS SIMULATION LAB</h2>
          </div>
          <button onClick={onClose} className="text-[#F4F7FA]/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 glass-panel p-4 rounded-xl text-xs">
            <div>
              <label className="block mb-1 text-[#4DD0E1] font-semibold font-orbitron">
                GRAVITY ENVIRONMENT
              </label>
              <select
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full bg-[#080F1E] border border-[#4DD0E1]/40 rounded-lg p-2.5 text-white font-orbitron text-xs focus:outline-none"
              >
                <option value={0.38}>Mars Gravity (0.38g)</option>
                <option value={1.0}>Earth Gravity (1.00g)</option>
                <option value={0.16}>Moon Gravity (0.16g)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-[#4DD0E1] font-semibold font-orbitron">
                BIOME TERRAIN TYPE
              </label>
              <select
                value={biome}
                onChange={(e) => setBiome(e.target.value)}
                className="w-full bg-[#080F1E] border border-[#4DD0E1]/40 rounded-lg p-2.5 text-white font-orbitron text-xs focus:outline-none"
              >
                <option value="basalt">Basalt Canyon (Grip: 0.92)</option>
                <option value="dunes">Golden Sand Dunes (Grip: 0.82)</option>
                <option value="ice">Polar Ice Cap Glacier (Grip: 0.96)</option>
                <option value="volcanic">Volcanic Caldera Ridge (Grip: 0.86)</option>
                <option value="lava">Cerberus Lava Chasm (Grip: 0.84)</option>
                <option value="summit">Olympus Mons Summit (Grip: 0.90)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[#4DD0E1] font-semibold font-orbitron">
                <span>SLOPE ANGLE</span>
                <span>{slope}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                value={slope}
                onChange={(e) => setSlope(parseInt(e.target.value))}
                className="w-full accent-[#E67E22] cursor-pointer"
              />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-[#E67E22] text-xs space-y-3">
            <h3 className="font-orbitron font-bold text-[#E67E22] text-sm">SIMULATION TELEMETRY</h3>
            <div className="space-y-2 text-[#F4F7FA]/80">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Friction Coefficient:</span>
                <strong className="text-white font-orbitron">{fCoeff}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Estimated Braking Distance:</span>
                <strong className="text-white font-orbitron">{brakeDist} meters</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Battery Power Draw Factor:</span>
                <strong className="text-white font-orbitron">{powerDraw}x</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Slide Risk Rating:</span>
                <strong
                  className={`font-orbitron font-bold ${
                    isHighRisk ? 'text-[#FF5722]' : 'text-[#2ECC71]'
                  }`}
                >
                  {isHighRisk ? 'HIGH RISK' : 'STABLE (LOW)'}
                </strong>
              </div>
            </div>
            <p className="text-[10px] text-white/50 italic">
              Values calculated using Martian atmospheric and surface telemetry models.
            </p>
          </div>
        </div>

        <div className="text-right pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#9E2A1B] font-orbitron font-bold text-xs text-white hover:bg-[#E67E22] transition-all cursor-pointer"
          >
            CLOSE SANDBOX
          </button>
        </div>
      </div>
    </div>
  );
};
