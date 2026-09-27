import React, { useState, useRef } from 'react';
import {
  Flame,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  ThermometerSnowflake,
  Shield,
  Zap,
  ArrowRight,
  Hammer,
  GripHorizontal,
  MoveDown
} from 'lucide-react';

interface LavaBridgeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  playSound?: (type: 'upgrade' | 'drive' | 'impact' | 'drill' | 'hazard' | 'clean' | 'ping' | 'alarm' | 'boom') => void;
}

interface BridgePart {
  id: string;
  name: string;
  icon: 'anchor' | 'shield' | 'layers' | 'cryo' | 'zap' | 'blocks';
  sectionId: number;
}

interface BridgeSection {
  id: number;
  name: string;
  label: string;
  desc: string;
  parts: BridgePart[];
}

const BRIDGE_SECTIONS: BridgeSection[] = [
  {
    id: 1,
    name: 'North Abutment Bedrock Anchor',
    label: 'Section 1: North Anchor',
    desc: 'Titanium anchors & vulcan grout locked into the northern basalt rim.',
    parts: [
      { id: 'anchor', name: 'Titanium Bedrock Strut', icon: 'anchor' as const, sectionId: 1 },
      { id: 'grout', name: 'Thermal Vulcan Grout', icon: 'layers' as const, sectionId: 1 }
    ]
  },
  {
    id: 2,
    name: 'North Chasm Basalt Deck',
    label: 'Section 2: Hex Deck',
    desc: 'Hexagonal interlocking basalt slabs & ceramic heat barriers.',
    parts: [
      { id: 'hex_tiles', name: 'Hexagonal Basalt Slabs', icon: 'blocks' as const, sectionId: 2 },
      { id: 'subfoil', name: 'Ceramic Heat Barrier', icon: 'shield' as const, sectionId: 2 }
    ]
  },
  {
    id: 3,
    name: 'Central Magma Deflector Pylon',
    label: 'Section 3: Cryo Wedge',
    desc: 'Hydrodynamic magma wedge pylon with liquid nitrogen conduits.',
    parts: [
      { id: 'wedge', name: 'Hydrodynamic Magma Wedge', icon: 'shield' as const, sectionId: 3 },
      { id: 'cryo', name: 'Liquid N2 Coolant Pipe', icon: 'cryo' as const, sectionId: 3 }
    ]
  },
  {
    id: 4,
    name: 'South Chasm Causeway Deck',
    label: 'Section 4: Slide Joint',
    desc: 'Thermal expansion slide joints & reinforced basalt decking.',
    parts: [
      { id: 'slider', name: 'Expansion Slide Joint', icon: 'layers' as const, sectionId: 4 },
      { id: 'plate', name: 'High-Tensile Basalt Decking', icon: 'blocks' as const, sectionId: 4 }
    ]
  },
  {
    id: 5,
    name: 'Central Core Island Approach',
    label: 'Section 5: Island Ramp',
    desc: 'Reinforced traction approach ramp with laser navigation beacons.',
    parts: [
      { id: 'ramp', name: 'Reinforced Traction Ramp', icon: 'layers' as const, sectionId: 5 },
      { id: 'laser', name: 'Laser Navigation Beacon', icon: 'zap' as const, sectionId: 5 }
    ]
  }
];

export const LavaBridgeBuilderModal: React.FC<LavaBridgeBuilderModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  playSound
}) => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [installedParts, setInstalledParts] = useState<Record<string, boolean>>({});
  const [temperature, setTemperature] = useState<number>(1380);
  const [draggedPartId, setDraggedPartId] = useState<string | null>(null);
  const [activeDropZoneId, setActiveDropZoneId] = useState<number | null>(null);
  const [recentDropEffect, setRecentDropEffect] = useState<number | null>(null);

  // Touch drag state
  const touchDraggingRef = useRef<{ partId: string; element: HTMLElement | null } | null>(null);

  if (!isOpen) return null;

  const totalParts = BRIDGE_SECTIONS.reduce((acc, s) => acc + s.parts.length, 0);
  const installedCount = Object.keys(installedParts).filter((k) => installedParts[k]).length;
  const allSectionsCompleted = completedSections.length === BRIDGE_SECTIONS.length;

  const installPart = (partId: string, sectionId: number) => {
    if (installedParts[partId]) return;

    if (playSound) playSound('clean');

    // Visual sizzle feedback in lava slot
    setRecentDropEffect(sectionId);
    setTimeout(() => setRecentDropEffect(null), 850);

    const nextParts = { ...installedParts, [partId]: true };
    setInstalledParts(nextParts);

    // Check if section is now fully completed
    const section = BRIDGE_SECTIONS.find((s) => s.id === sectionId);
    if (section) {
      const bothDone = section.parts.every((p) => nextParts[p.id]);
      if (bothDone && !completedSections.includes(sectionId)) {
        if (playSound) playSound('upgrade');
        const nextCompleted = [...completedSections, sectionId];
        setCompletedSections(nextCompleted);

        // Cool down the bridge causeway as sections solidify
        const newTemp = Math.max(32, 1380 - nextCompleted.length * 270);
        setTemperature(newTemp);
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, partId: string) => {
    e.dataTransfer.setData('text/plain', partId);
    e.dataTransfer.effectAllowed = 'copyMove';
    setDraggedPartId(partId);
  };

  const handleDragEnd = () => {
    setDraggedPartId(null);
    setActiveDropZoneId(null);
  };

  const handleDragOverZone = (e: React.DragEvent, sectionId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (activeDropZoneId !== sectionId) {
      setActiveDropZoneId(sectionId);
    }
  };

  const handleDragLeaveZone = (sectionId: number) => {
    if (activeDropZoneId === sectionId) {
      setActiveDropZoneId(null);
    }
  };

  const handleDropOnLavaSlot = (e: React.DragEvent, sectionId: number) => {
    e.preventDefault();
    const partId = e.dataTransfer.getData('text/plain') || draggedPartId;
    setActiveDropZoneId(null);
    setDraggedPartId(null);

    if (!partId) return;

    // Check if the part belongs to this section or any uninstalled section
    const targetSection = BRIDGE_SECTIONS.find((s) => s.id === sectionId);
    if (targetSection) {
      const matchingPart = targetSection.parts.find((p) => p.id === partId);
      if (matchingPart) {
        installPart(matchingPart.id, sectionId);
      } else {
        // If dropped on lava, auto-match to the part's correct section!
        const correctSection = BRIDGE_SECTIONS.find((s) => s.parts.some((p) => p.id === partId));
        if (correctSection) {
          installPart(partId, correctSection.id);
        }
      }
    }
  };

  // Mobile Touch Dragging support
  const handleTouchStart = (e: React.TouchEvent, partId: string) => {
    const touch = e.touches[0];
    touchDraggingRef.current = {
      partId,
      element: e.currentTarget as HTMLElement
    };
    setDraggedPartId(partId);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDraggingRef.current) return;
    const touch = e.changedTouches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elemBelow?.closest('[data-lava-slot]');

    if (dropZone) {
      const slotIdStr = dropZone.getAttribute('data-lava-slot');
      if (slotIdStr) {
        const slotId = parseInt(slotIdStr, 10);
        const partId = touchDraggingRef.current.partId;
        const targetSection = BRIDGE_SECTIONS.find((s) => s.id === slotId);
        if (targetSection) {
          const matchingPart = targetSection.parts.find((p) => p.id === partId);
          if (matchingPart) {
            installPart(matchingPart.id, slotId);
          } else {
            const correctSection = BRIDGE_SECTIONS.find((s) => s.parts.some((p) => p.id === partId));
            if (correctSection) {
              installPart(partId, correctSection.id);
            }
          }
        }
      }
    }

    touchDraggingRef.current = null;
    setDraggedPartId(null);
    setActiveDropZoneId(null);
  };

  const handleLaunchMission = () => {
    if (playSound) playSound('upgrade');
    onComplete();
  };

  const handleQuickAssembleAll = () => {
    const allParts: Record<string, boolean> = {};
    const allIds: number[] = [];
    BRIDGE_SECTIONS.forEach((s) => {
      allIds.push(s.id);
      s.parts.forEach((p) => {
        allParts[p.id] = true;
      });
    });
    setInstalledParts(allParts);
    setCompletedSections(allIds);
    setTemperature(32);
    if (playSound) playSound('upgrade');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-2 sm:p-4 backdrop-blur-md select-none overflow-y-auto">
      <div className="max-w-3xl w-full glass-panel rounded-2xl p-4 sm:p-6 border-2 border-[#FF3D00] space-y-3.5 text-center shadow-[0_0_60px_rgba(255,61,0,0.5)] my-auto max-h-[96vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#FF3D00]/40 pb-2.5">
          <div className="flex items-center space-x-2.5 text-[#FF3D00]">
            <Flame className="w-6 h-6 animate-pulse" />
            <div className="text-left">
              <h2 className="font-orbitron font-black text-sm sm:text-lg tracking-wider text-white">
                CERBERUS LAVA BRIDGE CONSTRUCTOR
              </h2>
              <span className="text-[10px] sm:text-xs text-[#FF9800] font-sans font-semibold">
                DRAG PIECES INTO THE LAVA TO FORGE THE BASALT CAUSEWAY
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
            title="Close builder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-orbitron">
          <div className="bg-black/60 p-2 rounded-xl border border-white/10">
            <span className="text-white/60 text-[10px] block">BRIDGE INTEGRITY</span>
            <strong className="text-[#2ECC71] text-xs sm:text-sm">
              {Math.round((installedCount / totalParts) * 100)}%
            </strong>
          </div>
          <div className="bg-black/60 p-2 rounded-xl border border-white/10">
            <span className="text-white/60 text-[10px] block">PARTS DEPLOYED</span>
            <strong className="text-[#00E5FF] text-xs sm:text-sm">
              {installedCount} / {totalParts}
            </strong>
          </div>
          <div className="bg-black/60 p-2 rounded-xl border border-white/10">
            <span className="text-white/60 text-[10px] block">CHASM MAGMA TEMP</span>
            <strong className={`${temperature > 300 ? 'text-[#FF3D00] animate-pulse' : 'text-[#2ECC71]'} text-xs sm:text-sm`}>
              {temperature}°C
            </strong>
          </div>
          <div className="bg-black/60 p-2 rounded-xl border border-white/10">
            <span className="text-white/60 text-[10px] block">CAUSEWAY STATUS</span>
            <strong className={`${allSectionsCompleted ? 'text-[#2ECC71]' : 'text-[#FF9800]'} text-xs sm:text-sm`}>
              {allSectionsCompleted ? 'TRAVERSABLE' : 'UNDER CONSTRUCTION'}
            </strong>
          </div>
        </div>

        {/* DRAG-AND-DROP INSTRUCTION BANNER */}
        <div className="bg-orange-950/70 border border-[#FF3D00]/50 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-white">
          <div className="flex items-center space-x-2">
            <MoveDown className="w-4 h-4 text-[#FF9800] animate-bounce" />
            <span className="font-semibold text-orange-200 text-[11px] sm:text-xs">
              Drag structural components below into the molten lava slots above to forge each section!
            </span>
          </div>
          <span className="hidden sm:inline text-[10px] font-orbitron text-white/50">
            (Or click any part to mount directly)
          </span>
        </div>

        {/* INTERACTIVE LAVA CHASM & BRIDGE DROP ZONE (DROP PIECES INTO THE LAVA) */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#FF3D00]/60 p-3 sm:p-4 bg-gradient-to-b from-[#1a0500] via-[#3a0d05] to-[#120300] shadow-[inset_0_0_40px_rgba(255,61,0,0.6)]">
          {/* Animated Glowing Molten Lava Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff5722] via-[#b71c1c] to-transparent animate-pulse" />

          {/* Shoreline Label Badges */}
          <div className="flex justify-between items-center text-[10px] font-orbitron font-bold text-white/70 mb-2 relative z-10 px-1">
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20">
              ◄ NORTH RIM CANYON
            </span>
            <span className="px-2.5 py-0.5 rounded bg-red-950/90 border border-red-500 text-red-200 flex items-center space-x-1 animate-pulse">
              <Flame className="w-3 h-3 text-[#FF3D00]" />
              <span>BOILING MAGMA LAKE (1,380°C)</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20">
              CENTRAL CORE ISLAND ►
            </span>
          </div>

          {/* 5 Structural Bridge Spans across the Molten Chasm */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative z-10">
            {BRIDGE_SECTIONS.map((sec) => {
              const isSectionComplete = completedSections.includes(sec.id);
              const isDropHover = activeDropZoneId === sec.id;
              const hasRecentDrop = recentDropEffect === sec.id;
              const sectionPartsDone = sec.parts.filter((p) => installedParts[p.id]).length;

              return (
                <div
                  key={sec.id}
                  data-lava-slot={sec.id}
                  onDragOver={(e) => handleDragOverZone(e, sec.id)}
                  onDragLeave={() => handleDragLeaveZone(sec.id)}
                  onDrop={(e) => handleDropOnLavaSlot(e, sec.id)}
                  className={`relative rounded-xl p-2.5 sm:p-3 text-center transition-all duration-200 border-2 flex flex-col justify-between min-h-[145px] ${
                    isSectionComplete
                      ? 'bg-emerald-950/85 border-emerald-500 shadow-[0_0_20px_rgba(46,204,113,0.5)] text-emerald-200'
                      : isDropHover
                      ? 'bg-amber-950/90 border-[#F1C40F] shadow-[0_0_30px_rgba(241,196,15,0.8)] scale-103 ring-2 ring-[#F1C40F]'
                      : 'bg-black/75 border-[#FF3D00]/50 hover:border-[#FF5722] text-white shadow-lg'
                  }`}
                >
                  {/* Steam & Basalt Solidification Hiss FX */}
                  {hasRecentDrop && (
                    <div className="absolute inset-0 bg-[#00E5FF]/30 rounded-xl flex items-center justify-center animate-ping pointer-events-none">
                      <Sparkles className="w-8 h-8 text-[#00E5FF]" />
                    </div>
                  )}

                  {/* Section Title */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-orbitron font-bold mb-1">
                      <span className={isSectionComplete ? 'text-emerald-400' : 'text-[#FF9800]'}>
                        SLOT {sec.id}
                      </span>
                      {isSectionComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[9px] text-white/50">
                          {sectionPartsDone}/2
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-orbitron font-semibold block text-white/90 leading-tight">
                      {sec.label}
                    </span>
                  </div>

                  {/* Visual Causeway Graphic in the Lava */}
                  <div className="my-1.5 p-2 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center justify-center min-h-[50px]">
                    {isSectionComplete ? (
                      <div className="flex flex-col items-center space-y-1 text-emerald-300">
                        <div className="w-full h-3 rounded bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 shadow-md border border-emerald-400 flex items-center justify-center">
                          <span className="text-[8px] font-mono text-black font-black uppercase">SOLID BASALT</span>
                        </div>
                        <span className="text-[9px] font-orbitron font-bold">100% SECURE</span>
                      </div>
                    ) : sectionPartsDone > 0 ? (
                      <div className="flex flex-col items-center space-y-1 text-amber-300">
                        <div className="w-full h-2 rounded bg-amber-500/80 animate-pulse border border-amber-400" />
                        <span className="text-[9px] font-orbitron">50% ASSEMBLED</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1 text-[#FF5722] opacity-80">
                        <Flame className="w-5 h-5 text-[#FF3D00] animate-pulse" />
                        <span className="text-[8px] font-orbitron font-bold tracking-wider">
                          MOLTEN MAGMA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Drop Target Badge */}
                  <div className={`py-1 px-1.5 rounded text-[9px] font-orbitron font-bold border transition-all ${
                    isSectionComplete
                      ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300'
                      : isDropHover
                      ? 'bg-[#F1C40F] text-black border-[#F1C40F] animate-bounce'
                      : 'bg-red-950/60 border-red-500/60 text-red-200'
                  }`}>
                    {isSectionComplete ? (
                      'BRIDGE SECURED'
                    ) : isDropHover ? (
                      'RELEASE TO FORGE!'
                    ) : (
                      'DROP PIECE HERE'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STRUCTURAL PARTS INVENTORY (DRAG SOURCE) */}
        <div className="bg-[#080F1E] p-3 sm:p-3.5 rounded-xl border border-[#FF3D00]/40 text-left space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-xs font-orbitron font-bold text-[#FF9800] uppercase tracking-wider flex items-center space-x-1.5">
              <GripHorizontal className="w-4 h-4 text-[#FF9800]" />
              <span>STRUCTURAL COMPONENTS INVENTORY (DRAG OR CLICK TO INSTALL)</span>
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              {installedCount} of {totalParts} Installed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
            {BRIDGE_SECTIONS.flatMap((s): BridgePart[] => s.parts).map((part: BridgePart) => {
              const isInstalled = !!installedParts[part.id];
              const isDraggingThis = draggedPartId === part.id;

              return (
                <div
                  key={part.id}
                  draggable={!isInstalled}
                  onDragStart={(e) => handleDragStart(e, part.id)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, part.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {
                    if (!isInstalled) installPart(part.id, part.sectionId);
                  }}
                  className={`p-2 rounded-xl border flex flex-col justify-between transition-all select-none ${
                    isInstalled
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300/80 cursor-default opacity-60'
                      : isDraggingThis
                      ? 'bg-orange-600/30 border-[#FF3D00] text-white scale-103 opacity-75 ring-2 ring-[#FF3D00]'
                      : 'bg-white/5 hover:bg-white/10 border-white/20 hover:border-[#FF3D00] text-white cursor-grab active:cursor-grabbing hover:scale-102 shadow-md'
                  }`}
                  title={isInstalled ? 'Part installed' : 'Drag this part into its bridge slot above or click to mount'}
                >
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${isInstalled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#FF3D00]/20 text-[#FF9800]'}`}>
                      {part.icon === 'shield' ? (
                        <Shield className="w-3.5 h-3.5" />
                      ) : part.icon === 'zap' ? (
                        <Zap className="w-3.5 h-3.5" />
                      ) : part.icon === 'cryo' ? (
                        <ThermometerSnowflake className="w-3.5 h-3.5" />
                      ) : (
                        <Layers className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-[10px] font-orbitron font-bold text-white/90 truncate">
                      SEC {part.sectionId}
                    </span>
                  </div>

                  <span className="text-[10px] font-sans font-bold leading-tight block text-white/95 line-clamp-2">
                    {part.name}
                  </span>

                  <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[9px] font-orbitron">
                    {isInstalled ? (
                      <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>MOUNTED</span>
                      </span>
                    ) : (
                      <span className="text-[#FF9800] flex items-center space-x-0.5 font-bold">
                        <GripHorizontal className="w-3 h-3" />
                        <span>DRAG ME</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-1 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-white/10">
          <div className="text-left text-[11px] text-white/80">
            {allSectionsCompleted ? (
              <span className="text-emerald-400 font-orbitron font-bold flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>CERBERUS CAUSEWAY SECURED • FULL VEHICLE CROSSING READY!</span>
              </span>
            ) : (
              <span className="text-white/70">
                Drag remaining pieces into the molten lava to complete the causeway.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {allSectionsCompleted ? (
              <button
                onClick={handleLaunchMission}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#00E5FF] text-black font-orbitron font-black text-xs md:text-sm tracking-widest shadow-[0_0_30px_rgba(46,204,113,0.7)] hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>DEPLOY ROVER ACROSS LAVA BRIDGE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleQuickAssembleAll}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-orbitron text-xs cursor-pointer flex items-center justify-center space-x-1.5 transition-all"
              >
                <Hammer className="w-3.5 h-3.5 text-[#FF9800]" />
                <span>AUTO-FORGE ALL SECTIONS</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
