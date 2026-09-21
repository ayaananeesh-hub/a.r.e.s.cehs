import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoverState,
  LevelConfig,
  DiscoveryItem,
  RoverCustomization,
} from './types';
import {
  biomeTypes,
  customizationCatalog,
  defaultRoverState,
  getInitialLevels,
  isPointInLava,
  getNearestSafePathPoint,
} from './data/gameData';
import { useSoundEffects } from './hooks/useSoundEffects';
import { GameCanvas } from './components/GameCanvas';
import { HUDOverlay } from './components/HUDOverlay';
import { TitleScreen } from './components/TitleScreen';
import { StoryCinematicModal } from './components/StoryCinematicModal';
import { Cinematic3DIntro } from './components/Cinematic3DIntro';
import { GearCalibrationModal } from './components/Minigames/GearCalibrationModal';
import { WaveSynthesizerModal } from './components/Minigames/WaveSynthesizerModal';
import { CircuitShieldModal } from './components/Minigames/CircuitShieldModal';
import { LavaPlatesModal } from './components/Minigames/LavaPlatesModal';
import { QuantumUplinkModal } from './components/Minigames/QuantumUplinkModal';
import { SolarCleanerModal } from './components/Minigames/SolarCleanerModal';
import { GarageModal } from './components/GarageModal';
import { PhysicsLabModal } from './components/PhysicsLabModal';
import { ScienceLogModal } from './components/ScienceLogModal';
import { PauseModal } from './components/PauseModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { ApkExportModal } from './components/ApkExportModal';

const SAVE_KEY = 'mars_rover_mission_save_v1';

export default function App() {
  const {
    audioEnabled,
    setAudioEnabled,
    voiceEnabled,
    setVoiceEnabled,
    playSound,
    speakText,
  } = useSoundEffects();

  // Primary Game States
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [levels, setLevels] = useState<Record<number, LevelConfig>>(getInitialLevels());
  const [rover, setRover] = useState<RoverState>(defaultRoverState);
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Modals & UI States
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(false);
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);
  const [showMinigame1, setShowMinigame1] = useState<boolean>(false);
  const [showMinigame2, setShowMinigame2] = useState<boolean>(false);
  const [showMinigame3, setShowMinigame3] = useState<boolean>(false);
  const [showMinigame4, setShowMinigame4] = useState<boolean>(false);
  const [showMinigame5, setShowMinigame5] = useState<boolean>(false);
  const [inLavaHazard, setInLavaHazard] = useState<boolean>(false);
  const [showCleanerModal, setShowCleanerModal] = useState<boolean>(false);
  const [showGarageModal, setShowGarageModal] = useState<boolean>(false);
  const [showPhysicsLab, setShowPhysicsLab] = useState<boolean>(false);
  const [showScienceLog, setShowScienceLog] = useState<boolean>(false);
  const [showLevelComplete, setShowLevelComplete] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);

  // HUD & Telemetry
  const [radioSubtitle, setRadioSubtitle] = useState<string | null>(null);
  const radioTimerRef = useRef<number | null>(null);
  const [radarPulseTrigger, setRadarPulseTrigger] = useState<number>(0);
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);

  // Active Key States & Touch States
  const keysRef = useRef<Record<string, boolean>>({});
  const touchDirectionRef = useRef<Record<string, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Radio Subtitle & Voice Helper
  const showRadioMessage = useCallback(
    (text: string) => {
      setRadioSubtitle(text);
      speakText(text);
      if (radioTimerRef.current) clearTimeout(radioTimerRef.current);
      radioTimerRef.current = window.setTimeout(() => {
        setRadioSubtitle(null);
      }, 6000);
    },
    [speakText]
  );

  // Save State
  const saveGameState = useCallback(() => {
    try {
      const saveData = {
        currentLevelNum,
        rover,
        discoveries,
        levels,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      setHasSaveData(true);
    } catch {
      // Storage error fallback
    }
  }, [currentLevelNum, rover, discoveries, levels]);

  // Load State
  const loadGameState = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.currentLevelNum) return false;

      setCurrentLevelNum(data.currentLevelNum || 1);
      if (data.rover) setRover(data.rover);
      if (data.discoveries) setDiscoveries(data.discoveries);
      if (data.levels) setLevels(data.levels);
      setHasSaveData(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Check save on mount
  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) setHasSaveData(true);
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'p' || e.key === 'P') {
        if (isGameRunning) setIsPaused((prev) => !prev);
      }
      if (e.key === 'e' || e.key === 'E') {
        handleInteract();
      }
      if (e.key === ' ') {
        handleRadarScan();
      }
      if (e.key === 'r' || e.key === 'R') {
        setShowCleanerModal(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  // Current level reference
  const curLevel = levels[currentLevelNum] || levels[1];

  // Radar Scan logic
  const handleRadarScan = useCallback(() => {
    playSound('ping');
    setRadarPulseTrigger((p) => p + 1);

    // Award science points for exploration scanning
    setRover((prev) => ({
      ...prev,
      sciencePoints: prev.sciencePoints + 5,
    }));

    if (currentLevelNum === 2) {
      const iceTarget = curLevel.targets.find((t) => t.type === 'ice');
      if (iceTarget) {
        const dist = Math.hypot(rover.x - iceTarget.x, rover.y - iceTarget.y);
        if (dist < 220) {
          setLevels((prevLevels) => {
            const next = { ...prevLevels };
            const lvl2 = { ...next[2] };
            lvl2.targets = lvl2.targets.map((t) =>
              t.type === 'ice' ? { ...t, scanned: true } : t
            );
            lvl2.objectives = lvl2.objectives.map((o) =>
              o.id === 'radarIce' ? { ...o, done: true } : o
            );
            next[2] = lvl2;
            return next;
          });

          showRadioMessage(
            'Radar Pulse: Subsurface glacier ice sheet detected 0.4m beneath dune silt!'
          );

          setDiscoveries((prev) => {
            if (prev.some((d) => d.title === iceTarget.name)) return prev;
            return [
              ...prev,
              {
                title: iceTarget.name,
                desc: iceTarget.info || 'Subsurface glacier permafrost.',
                coords: `${Math.round(rover.x)}, ${Math.round(rover.y)}`,
                temp: '-85°C',
              },
            ];
          });

          setRover((prev) => ({ ...prev, sciencePoints: prev.sciencePoints + 50 }));
          return;
        }
      }
    }

    showRadioMessage('Radar pulse emitted. Surface telemetry refreshed.');
  }, [currentLevelNum, curLevel, rover.x, rover.y, playSound, showRadioMessage]);

  // Object interaction logic
  const handleInteract = useCallback(() => {
    const curTargets = curLevel.targets;
    for (const t of curTargets) {
      const dist = Math.hypot(rover.x - t.x, rover.y - t.y);
      if (dist < 75) {
        playSound('drill');

        if (t.type === 'station') {
          if (currentLevelNum === 1) setShowMinigame1(true);
          else if (currentLevelNum === 2) setShowMinigame2(true);
          else if (currentLevelNum === 3) setShowMinigame3(true);
          else if (currentLevelNum === 4) setShowMinigame4(true);
          else if (currentLevelNum === 5) setShowMinigame5(true);
          return;
        }

        if (t.type === 'sample' && !t.collected) {
          setLevels((prevLevels) => {
            const next = { ...prevLevels };
            const lvl = { ...next[currentLevelNum] };
            lvl.targets = lvl.targets.map((item) =>
              item.name === t.name ? { ...item, collected: true } : item
            );
            lvl.objectives = lvl.objectives.map((obj) =>
              obj.id === 'sample1' ||
              obj.id === 'volcanoScan' ||
              obj.id === 'magmaSample' ||
              obj.id === 'summitSample'
                ? { ...obj, done: true }
                : obj
            );
            next[currentLevelNum] = lvl;
            return next;
          });

          const sampleTemp =
            curLevel.biome === 'lava'
              ? '+620°C'
              : curLevel.biome === 'summit'
              ? '-115°C'
              : curLevel.biome === 'ice'
              ? '-94°C'
              : '-62°C';

          setDiscoveries((prev) => [
            ...prev,
            {
              title: t.name,
              desc: t.info || 'Geological sample gathered from Martian surface.',
              coords: `${Math.round(rover.x)}, ${Math.round(rover.y)}`,
              temp: sampleTemp,
            },
          ]);

          setRover((prev) => ({ ...prev, sciencePoints: prev.sciencePoints + 60 }));
          showRadioMessage(`Discovery cataloged: ${t.name}. Added to Science Log.`);
          return;
        }

        if (t.type === 'relay') {
          setLevels((prevLevels) => {
            const next = { ...prevLevels };
            const lvl = { ...next[currentLevelNum] };
            lvl.objectives = lvl.objectives.map((obj) =>
              obj.id === 'transmit' ||
              obj.id === 'reachTower' ||
              obj.id === 'geoGenerator' ||
              obj.id === 'quantumArray'
                ? { ...obj, done: true }
                : obj
            );
            next[currentLevelNum] = lvl;
            return next;
          });

          setRover((prev) => ({ ...prev, sciencePoints: prev.sciencePoints + 80 }));
          showRadioMessage(
            currentLevelNum === 4
              ? 'Geothermal Power Generator activated! Infinite clean energy tapped from the lava chasm.'
              : currentLevelNum === 5
              ? 'Deep Space Quantum Uplink locked! Direct high-bandwidth transmission routed to Earth.'
              : 'Relay Transmission Complete! Direct data uplink to Earth verified.'
          );
          return;
        }

        if (t.type === 'settlement' && !t.marked) {
          setLevels((prevLevels) => {
            const next = { ...prevLevels };
            const lvl = { ...next[currentLevelNum] };
            lvl.targets = lvl.targets.map((item) =>
              item.type === 'settlement' ? { ...item, marked: true } : item
            );
            lvl.objectives = lvl.objectives.map((obj) =>
              obj.id === 'markSettlement' || obj.id === 'colonyDome' ? { ...obj, done: true } : obj
            );
            next[currentLevelNum] = lvl;
            return next;
          });

          setRover((prev) => ({ ...prev, sciencePoints: prev.sciencePoints + 100 }));
          showRadioMessage(
            currentLevelNum === 5
              ? 'Colony Habitat Dome Alpha online! Humanity has planted its permanent flag on Mars.'
              : 'Settlement Zone Alpha marked! Suitable site confirmed for human colony.'
          );
          return;
        }
      }
    }
  }, [curLevel, rover.x, rover.y, currentLevelNum, playSound, showRadioMessage]);

  // Main Game Physics Loop
  useEffect(() => {
    if (!isGameRunning || isPaused) return;

    let animId: number;

    const loop = () => {
      const curBiome = biomeTypes[curLevel.biome] || biomeTypes.basalt;
      let speedMult = curBiome.accelMult;
      if (rover.upgrades.duneTreads && curLevel.biome === 'dunes') {
        speedMult = 1.15;
      }

      setRover((prev) => {
        let { x, y, angle, speed, battery, dust } = prev;
        const keys = keysRef.current;
        const touch = touchDirectionRef.current;

        const isMovingForward = keys['w'] || keys['arrowup'] || touch.up;
        const isMovingBackward = keys['s'] || keys['arrowdown'] || touch.down;
        const isTurningLeft = keys['a'] || keys['arrowleft'] || touch.left;
        const isTurningRight = keys['d'] || keys['arrowright'] || touch.right;

        if (isMovingForward) {
          speed = Math.min(speed + 0.22 * speedMult, 5.2);
          playSound('drive');
        } else if (isMovingBackward) {
          speed = Math.max(speed - 0.22 * speedMult, -2.4);
        } else {
          speed *= curBiome.drag;
        }

        if (isTurningLeft) angle -= 0.052;
        if (isTurningRight) angle += 0.052;

        x += Math.cos(angle) * speed;
        y += Math.sin(angle) * speed;

        // Keep inside bounds
        x = Math.max(35, Math.min(curLevel.mapWidth - 35, x));
        y = Math.max(35, Math.min(curLevel.mapHeight - 35, y));

        // Lava Hazard Detection and Physics
        if (curLevel.lavaZones && curLevel.lavaZones.length > 0) {
          const inLava = isPointInLava(x, y, curLevel);
          setInLavaHazard(inLava);

          if (inLava) {
            // Extreme thermal heat environment!
            const hasPlates = prev.upgrades.lavaPlates;
            const drainRate = hasPlates ? 0.015 : 0.055;
            battery = Math.max(0, battery - drainRate);
            speed *= hasPlates ? 0.94 : 0.85;

            // Occasional hazard audio tick
            if (Math.random() < 0.02) {
              playSound('hazard');
            }

            // Emergency thermal rescue if battery drained in lava
            if (battery <= 0) {
              const safePt = getNearestSafePathPoint(x, y, curLevel);
              x = safePt.x;
              y = safePt.y;
              speed = 0;
              battery = 25;
              showRadioMessage('EMERGENCY THERMAL PURGE: Critical hull temperature! Rover retrieved to nearest safe basalt bridge.');
            }
          }
        } else {
          setInLavaHazard(false);
        }

        // Level 4: Check if rover crossed bridge to Central Core Island
        if (currentLevelNum === 4) {
          const crossObj = curLevel.objectives.find((o) => o.id === 'crossChasm');
          if (crossObj && !crossObj.done) {
            const distToCore = Math.hypot(x - 1700, y - 1700);
            if (distToCore < 180) {
              setLevels((prevL) => {
                const next = { ...prevL };
                next[4].objectives = next[4].objectives.map((o) =>
                  o.id === 'crossChasm' ? { ...o, done: true } : o
                );
                return next;
              });
              showRadioMessage('Ares Explorer successfully crossed the basalt bridge to Central Core Island!');
            }
          }
        }

        // Dust & Battery Telemetry
        if (Math.abs(speed) > 0.4) {
          dust = Math.min(100, dust + 0.006);
          battery = Math.max(0, battery - 0.007);
        } else {
          battery = Math.min(100, battery + 0.005 * ((100 - dust) / 100));
        }

        // Objective 1: Check if rover left capsule zone
        if (currentLevelNum === 1) {
          const moveObj = curLevel.objectives.find((o) => o.id === 'move');
          if (moveObj && !moveObj.done) {
            const distFromStart = Math.hypot(x - curLevel.startPos.x, y - curLevel.startPos.y);
            if (distFromStart > 200) {
              setLevels((prevL) => {
                const next = { ...prevL };
                next[1].objectives = next[1].objectives.map((o) =>
                  o.id === 'move' ? { ...o, done: true } : o
                );
                return next;
              });
              showRadioMessage('Ares Explorer has entered Basalt Canyon. Proceed toward targets.');
            }
          }
        }

        return {
          ...prev,
          x,
          y,
          angle,
          speed,
          battery,
          dust,
          solarEff: 100 - dust,
        };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameRunning, isPaused, curLevel, rover.upgrades.duneTreads, rover.upgrades.lavaPlates, currentLevelNum, playSound, showRadioMessage]);

  // Check level completion
  useEffect(() => {
    if (!isGameRunning) return;
    const allDone = curLevel.objectives.every((o) => o.done);
    if (allDone && !showLevelComplete) {
      setShowLevelComplete(true);
      playSound('upgrade');
      setRover((prev) => ({
        ...prev,
        sciencePoints: prev.sciencePoints + 150,
      }));
    }
  }, [curLevel.objectives, isGameRunning, showLevelComplete, playSound]);

  // Proximity to interactive objects
  const nearInteractive = curLevel.targets.some((t) => {
    return Math.hypot(rover.x - t.x, rover.y - t.y) < 75;
  });

  const activeSkin =
    customizationCatalog.skins.find((s) => s.id === rover.customization.skin) ||
    customizationCatalog.skins[0];
  const activeWheel =
    customizationCatalog.wheels.find((w) => w.id === rover.customization.wheel) ||
    customizationCatalog.wheels[0];
  const activeLight =
    customizationCatalog.lights.find((l) => l.id === rover.customization.light) ||
    customizationCatalog.lights[0];
  const activeTrail =
    customizationCatalog.trails.find((t) => t.id === rover.customization.trail) ||
    customizationCatalog.trails[0];

  const activeObjective = curLevel.objectives.find((o) => !o.done);
  const currentObjectiveText = activeObjective
    ? activeObjective.text
    : 'All primary objectives complete! Ready for next biome.';

  // Flow handlers
  const handleStartNewGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setCurrentLevelNum(1);
    setLevels(getInitialLevels());
    setRover(defaultRoverState);
    setDiscoveries([]);
    setShowCinematicIntro(true);
  };

  const handleFinishCinematicIntro = () => {
    setShowCinematicIntro(false);
    setIsGameRunning(true);
    setIsPaused(false);
    saveGameState();
    showRadioMessage(`Touchdown confirmed! Commencing exploration in ${curLevel.subtitle}.`);
  };

  const handleSwitchToStoryFromCinematic = () => {
    setShowCinematicIntro(false);
    setShowStoryModal(true);
  };

  const handleResumeGame = () => {
    loadGameState();
    setIsGameRunning(true);
    setIsPaused(false);
    showRadioMessage(`Resuming mission in ${curLevel.subtitle}.`);
  };

  const handleStartGameFromStory = () => {
    setShowStoryModal(false);
    setIsGameRunning(true);
    setIsPaused(false);
    saveGameState();
    showRadioMessage(`Commencing exploration in ${curLevel.subtitle}.`);
  };

  const handleProceedToNextLevel = () => {
    setShowLevelComplete(false);
    if (currentLevelNum < 5) {
      const nextLvl = currentLevelNum + 1;
      setCurrentLevelNum(nextLvl);
      setRover((prev) => ({
        ...prev,
        x: levels[nextLvl].startPos.x,
        y: levels[nextLvl].startPos.y,
        speed: 0,
        battery: 100,
      }));
      saveGameState();
      showRadioMessage(`Entering Biome ${nextLvl}: ${levels[nextLvl].subtitle}.`);
    } else {
      showRadioMessage('Mission Accomplished! Olympus Mons Summit conquered and Mars colonization initiated!');
      setIsGameRunning(false);
    }
  };

  // Minigame completion callbacks
  const handleCompleteM1 = () => {
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, duneTreads: true },
      sciencePoints: prev.sciencePoints + 75,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[1].objectives = next[1].objectives.map((o) =>
        o.id === 'upgrade1' ? { ...o, done: true } : o
      );
      return next;
    });
    setShowMinigame1(false);
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Sand Dune Treads online! High dune traction enabled.');
    saveGameState();
  };

  const handleCompleteM2 = () => {
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, iceRadar: true },
      sciencePoints: prev.sciencePoints + 75,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[2].objectives = next[2].objectives.map((o) =>
        o.id === 'upgrade2' ? { ...o, done: true } : o
      );
      return next;
    });
    setShowMinigame2(false);
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Subsurface Wave Radar active! Ready to locate buried ice.');
    saveGameState();
  };

  const handleCompleteM3 = () => {
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, stormShield: true },
      sciencePoints: prev.sciencePoints + 75,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[3].objectives = next[3].objectives.map((o) =>
        o.id === 'upgrade3' ? { ...o, done: true } : o
      );
      return next;
    });
    setShowMinigame3(false);
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Volcanic Storm Shielding online! High heat resistance active.');
    saveGameState();
  };

  const handleCompleteM4 = () => {
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, lavaPlates: true },
      sciencePoints: prev.sciencePoints + 85,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[4].objectives = next[4].objectives.map((o) =>
        o.id === 'upgrade4' ? { ...o, done: true } : o
      );
      return next;
    });
    setShowMinigame4(false);
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Ceramic Lava Heat Plates active! Extreme magma tolerance enabled.');
    saveGameState();
  };

  const handleCompleteM5 = () => {
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, quantumUplink: true },
      sciencePoints: prev.sciencePoints + 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[5].objectives = next[5].objectives.map((o) =>
        o.id === 'upgrade5' ? { ...o, done: true } : o
      );
      return next;
    });
    setShowMinigame5(false);
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Deep Space Quantum Uplink online! High-bandwidth interstellar communications verified.');
    saveGameState();
  };

  const handleFinishCleaning = (cleanedDust: number) => {
    setRover((prev) => ({
      ...prev,
      dust: cleanedDust,
      solarEff: 100 - cleanedDust,
      sciencePoints: prev.sciencePoints + 25,
    }));
    setShowCleanerModal(false);
    playSound('clean');
    showRadioMessage('Solar panels wiped clean! Power generation efficiency restored.');
  };

  // Customization Garage Buy & Equip
  const handleEquipCosmetic = (category: keyof RoverCustomization, id: string) => {
    setRover((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        [category]: id,
      },
    }));
    playSound('clean');
    saveGameState();
  };

  const handleBuyCosmetic = (
    category: keyof RoverCustomization,
    id: string,
    cost: number
  ) => {
    if (rover.sciencePoints < cost) {
      showRadioMessage(`Insufficient Science Points! You need ${cost} SP.`);
      return;
    }
    setRover((prev) => {
      const unlockedKey =
        category === 'skin'
          ? 'unlockedSkins'
          : category === 'wheel'
          ? 'unlockedWheels'
          : category === 'light'
          ? 'unlockedLights'
          : 'unlockedTrails';

      return {
        ...prev,
        sciencePoints: prev.sciencePoints - cost,
        [unlockedKey]: [...prev[unlockedKey], id],
        customization: {
          ...prev.customization,
          [category]: id,
        },
      };
    });
    playSound('upgrade');
    showRadioMessage(`Unlocked and equipped ${id}!`);
    saveGameState();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#080F1E] text-[#F4F7FA]">
      {/* Primary Gameplay Canvas Stack */}
      <GameCanvas
        currentLevel={curLevel}
        rover={rover}
        skin={activeSkin}
        wheel={activeWheel}
        light={activeLight}
        trail={activeTrail}
        radarPulseTrigger={radarPulseTrigger}
        inLavaHazard={inLavaHazard}
      />

      {/* CRT Scanline effect */}
      <div className="scanlines absolute inset-0 z-10 pointer-events-none" />

      {/* HUD Layer (active when running and not in title) */}
      {isGameRunning && (
        <HUDOverlay
          currentLevel={curLevel}
          rover={rover}
          activeSkin={activeSkin}
          currentObjectiveText={currentObjectiveText}
          radioSubtitleText={radioSubtitle}
          nearInteractive={nearInteractive}
          inLavaHazard={inLavaHazard}
          onPause={() => setIsPaused(true)}
          onRadarScan={handleRadarScan}
          onOpenCleaner={() => setShowCleanerModal(true)}
          onOpenUpgradeLab={() => {
            if (currentLevelNum === 1) setShowMinigame1(true);
            else if (currentLevelNum === 2) setShowMinigame2(true);
            else if (currentLevelNum === 3) setShowMinigame3(true);
            else if (currentLevelNum === 4) setShowMinigame4(true);
            else if (currentLevelNum === 5) setShowMinigame5(true);
          }}
          onOpenGarage={() => setShowGarageModal(true)}
          onOpenScienceLog={() => setShowScienceLog(true)}
          onOpenApkModal={() => setShowApkModal(true)}
          onTouchDirection={(dir, pressed) => {
            touchDirectionRef.current[dir] = pressed;
          }}
          onTouchInteract={handleInteract}
        />
      )}

      {/* Title Screen Modal */}
      {!isGameRunning && !showStoryModal && !showCinematicIntro && (
        <TitleScreen
          hasSaveData={hasSaveData}
          saveSummaryText={`LEVEL ${currentLevelNum} - ${curLevel.subtitle.toUpperCase()}`}
          onResume={handleResumeGame}
          onNewGame={handleStartNewGame}
          onWatchCinematic={() => setShowCinematicIntro(true)}
          onOpenPhysics={() => setShowPhysicsLab(true)}
          onOpenGarage={() => setShowGarageModal(true)}
          onOpenApkModal={() => setShowApkModal(true)}
          audioEnabled={audioEnabled}
          setAudioEnabled={setAudioEnabled}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
        />
      )}

      {/* 3D Physics EDL Cinematic Introduction Video */}
      <Cinematic3DIntro
        isOpen={showCinematicIntro}
        onFinish={handleFinishCinematicIntro}
        onOpenStoryBriefing={handleSwitchToStoryFromCinematic}
        playSound={playSound}
        speakText={speakText}
        audioEnabled={audioEnabled}
      />

      {/* Story Cinematic Modal */}
      <StoryCinematicModal
        isOpen={showStoryModal}
        onFinish={handleStartGameFromStory}
        onSceneChange={(text) => speakText(text)}
      />

      {/* Minigames */}
      <GearCalibrationModal
        isOpen={showMinigame1}
        onClose={() => setShowMinigame1(false)}
        onComplete={handleCompleteM1}
      />

      <WaveSynthesizerModal
        isOpen={showMinigame2}
        onClose={() => setShowMinigame2(false)}
        onComplete={handleCompleteM2}
      />

      <CircuitShieldModal
        isOpen={showMinigame3}
        onClose={() => setShowMinigame3(false)}
        onComplete={handleCompleteM3}
      />

      <LavaPlatesModal
        isOpen={showMinigame4}
        onClose={() => setShowMinigame4(false)}
        onComplete={handleCompleteM4}
      />

      <QuantumUplinkModal
        isOpen={showMinigame5}
        onClose={() => setShowMinigame5(false)}
        onComplete={handleCompleteM5}
      />

      <SolarCleanerModal
        isOpen={showCleanerModal}
        onClose={() => setShowCleanerModal(false)}
        currentDust={rover.dust}
        onFinishCleaning={handleFinishCleaning}
      />

      {/* Garage Customization Modal */}
      <GarageModal
        isOpen={showGarageModal}
        onClose={() => setShowGarageModal(false)}
        catalog={customizationCatalog}
        customization={rover.customization}
        sciencePoints={rover.sciencePoints}
        unlockedSkins={rover.unlockedSkins}
        unlockedWheels={rover.unlockedWheels}
        unlockedLights={rover.unlockedLights}
        unlockedTrails={rover.unlockedTrails}
        onEquip={handleEquipCosmetic}
        onBuy={handleBuyCosmetic}
      />

      {/* Physics Simulation Lab */}
      <PhysicsLabModal
        isOpen={showPhysicsLab}
        onClose={() => setShowPhysicsLab(false)}
      />

      {/* Science Notebook */}
      <ScienceLogModal
        isOpen={showScienceLog}
        onClose={() => setShowScienceLog(false)}
        discoveries={discoveries}
      />

      {/* Pause Modal */}
      <PauseModal
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onSave={() => {
          saveGameState();
          showRadioMessage('Mission telemetry saved to storage.');
        }}
        onWatchCinematic={() => {
          setIsPaused(false);
          setShowCinematicIntro(true);
        }}
        onOpenPhysics={() => setShowPhysicsLab(true)}
        onMainMenu={() => {
          saveGameState();
          setIsGameRunning(false);
          setIsPaused(false);
        }}
      />

      {/* Biome Complete Celebration Modal */}
      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNum={currentLevelNum}
        totalDiscoveries={discoveries.length}
        batteryRemaining={rover.battery}
        onProceed={handleProceedToNextLevel}
      />

      {/* Android APK & Packaging Hub Modal */}
      <ApkExportModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />
    </div>
  );
}
