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
  getFreeRoamLevel,
  isPointInLava,
  getNearestSafePathPoint,
} from './data/gameData';
import { useSoundEffects } from './hooks/useSoundEffects';
import { GameCanvas, CameraMode } from './components/GameCanvas';
import { HUDOverlay, DangerAlertData } from './components/HUDOverlay';
import { TitleScreen } from './components/TitleScreen';
import { StoryCinematicModal } from './components/StoryCinematicModal';
import { GearCalibrationModal } from './components/Minigames/GearCalibrationModal';
import { WaveSynthesizerModal } from './components/Minigames/WaveSynthesizerModal';
import { CircuitShieldModal } from './components/Minigames/CircuitShieldModal';
import { LavaPlatesModal } from './components/Minigames/LavaPlatesModal';
import { LavaBridgeBuilderModal } from './components/Minigames/LavaBridgeBuilderModal';
import { QuantumUplinkModal } from './components/Minigames/QuantumUplinkModal';
import { SolarCleanerModal } from './components/Minigames/SolarCleanerModal';
import { GarageModal } from './components/GarageModal';
import { PhysicsLabModal } from './components/PhysicsLabModal';
import { ScienceLogModal } from './components/ScienceLogModal';
import { PauseModal } from './components/PauseModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { TenYearsLaterModal } from './components/TenYearsLaterModal';
import { CharacterAuthModal } from './components/CharacterAuthModal';
import { CommanderSelectionGate } from './components/CommanderSelectionGate';
import { BiomeTeleportModal } from './components/BiomeTeleportModal';
import { GameOverModal } from './components/GameOverModal';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { HudDemoModal } from './components/HudDemoModal';
import { CharacterProfile } from './types';
import {
  getAllProfiles,
  getProfile,
  getActiveProfileId,
  saveProfile,
  loginOrRegisterProfile,
  resetCharacterProfile,
  getTierForPointsSpent,
  isAresProfile,
  syncProfilesWithServer,
} from './utils/characterProfiles';

export default function App() {
  const {
    audioEnabled,
    setAudioEnabled,
    voiceEnabled,
    setVoiceEnabled,
    playSound,
    speakText,
  } = useSoundEffects();

  // Character Profile State & Initial Gatekeeper
  const [activeProfile, setActiveProfile] = useState<CharacterProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCommanderGateOpen, setIsCommanderGateOpen] = useState<boolean>(true);

  // Primary Game States
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [levels, setLevels] = useState<Record<number, LevelConfig>>(getInitialLevels());
  const [rover, setRover] = useState<RoverState>({
    ...defaultRoverState,
    coins: 0,
    headlightsOn: true,
  });
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [isGameRunning, setIsGameRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFreeRoamMode, setIsFreeRoamMode] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');

  // Modals & UI States
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);
  const [showBiomeTeleportModal, setShowBiomeTeleportModal] = useState<boolean>(false);
  const [showMinigame1, setShowMinigame1] = useState<boolean>(false);
  const [showMinigame2, setShowMinigame2] = useState<boolean>(false);
  const [showMinigame3, setShowMinigame3] = useState<boolean>(false);
  const [showMinigame4, setShowMinigame4] = useState<boolean>(false);
  const [showMinigame5, setShowMinigame5] = useState<boolean>(false);
  const [showLavaBridgeModal, setShowLavaBridgeModal] = useState<boolean>(false);
  const [inLavaHazard, setInLavaHazard] = useState<boolean>(false);
  const [showCleanerModal, setShowCleanerModal] = useState<boolean>(false);
  const [showGarageModal, setShowGarageModal] = useState<boolean>(false);
  const [showPhysicsLab, setShowPhysicsLab] = useState<boolean>(false);
  const [showScienceLog, setShowScienceLog] = useState<boolean>(false);
  const [showLevelComplete, setShowLevelComplete] = useState<boolean>(false);
  const [showTenYearsLaterModal, setShowTenYearsLaterModal] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [showMissionBriefing, setShowMissionBriefing] = useState<boolean>(false);
  const [showHudDemo, setShowHudDemo] = useState<boolean>(false);

  // 1-Second Drilling Animation States
  const [isDrillingSample, setIsDrillingSample] = useState<boolean>(false);
  const isDrillingActiveRef = useRef<boolean>(false);
  const [drillingProgress, setDrillingProgress] = useState<number>(0);

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

  // Danger & Collision Alert System
  const [dangerAlert, setDangerAlert] = useState<DangerAlertData | null>(null);
  const dangerAlertTimeoutRef = useRef<number | null>(null);
  const lastRockHitTimeRef = useRef<number>(0);
  const lastLavaAlertTimeRef = useRef<number>(0);
  const [lastCollisionTrigger, setLastCollisionTrigger] = useState<number>(0);

  const triggerDangerAlert = useCallback(
    (
      text: string,
      subtext?: string,
      type: 'lava' | 'rock' | 'critical' | 'repaired' = 'rock',
      durationMs = 3200
    ) => {
      if (dangerAlertTimeoutRef.current) {
        clearTimeout(dangerAlertTimeoutRef.current);
      }
      setDangerAlert({ text, subtext, type });
      dangerAlertTimeoutRef.current = window.setTimeout(() => {
        setDangerAlert(null);
      }, durationMs);
    },
    []
  );

  // Radio Subtitle Helper (Without voice reading every routine coin/telemetry action)
  const showRadioMessage = useCallback(
    (text: string) => {
      setRadioSubtitle(text);
      playSound('ping');
      if (radioTimerRef.current) clearTimeout(radioTimerRef.current);
      radioTimerRef.current = window.setTimeout(() => {
        setRadioSubtitle(null);
      }, 5500);
    },
    [playSound]
  );

  // Headlights Toggle Handler
  const handleToggleHeadlights = useCallback(() => {
    setRover((prev) => {
      const nextHl = prev.headlightsOn === false ? true : false;
      return { ...prev, headlightsOn: nextHl };
    });
    playSound('clean');
  }, [playSound]);

  // Save State for current character profile
  const saveGameState = useCallback((customRover?: RoverState) => {
    try {
      const activeR = customRover || rover;
      const currentCoins = activeR.coins ?? activeR.dust ?? 0;
      const spent = activeR.pointsSpent ?? 0;
      const earned = activeR.totalPointsEarned ?? (currentCoins + spent);
      const unlockedSkins = Array.isArray(activeR.unlockedSkins) && activeR.unlockedSkins.length > 0 ? activeR.unlockedSkins : ['classic'];
      const unlockedWheels = Array.isArray(activeR.unlockedWheels) && activeR.unlockedWheels.length > 0 ? activeR.unlockedWheels : ['standard'];
      const unlockedLights = Array.isArray(activeR.unlockedLights) && activeR.unlockedLights.length > 0 ? activeR.unlockedLights : ['cyan'];
      const unlockedTrails = Array.isArray(activeR.unlockedTrails) && activeR.unlockedTrails.length > 0 ? activeR.unlockedTrails : ['none', 'dust'];
      const customization = activeR.customization || {
        skin: 'classic',
        wheel: 'standard',
        light: 'cyan',
        trail: 'dust',
      };

      const profileToSave: CharacterProfile = {
        id: activeProfile?.id || 'ayaan',
        name: activeProfile?.name || 'Ayaan',
        coins: currentCoins,
        pointsSpent: spent,
        totalPointsEarned: earned,
        currentLevelNum,
        createdAt: activeProfile?.createdAt || new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        rover: {
          ...activeR,
          coins: currentCoins,
          pointsSpent: spent,
          totalPointsEarned: earned,
          unlockedSkins,
          unlockedWheels,
          unlockedLights,
          unlockedTrails,
          customization,
        },
        discoveries,
        levels,
      };
      saveProfile(profileToSave);
      setActiveProfile(profileToSave);
      setHasSaveData(true);
    } catch {
      // Storage error fallback
    }
  }, [activeProfile, currentLevelNum, rover, discoveries, levels]);

  // Load state for a specific character profile
  const applyProfileToState = useCallback((profile: CharacterProfile) => {
    setActiveProfile(profile);
    setCurrentLevelNum(profile.currentLevelNum || 1);
    if (profile.discoveries) setDiscoveries(profile.discoveries);
    if (profile.levels) {
      const initial = getInitialLevels();
      const merged: Record<number, LevelConfig> = {};
      for (const [k, v] of Object.entries(initial)) {
        const num = Number(k);
        const savedLvl = profile.levels[num];
        if (savedLvl) {
          merged[num] = {
            ...v,
            ...savedLvl,
            rocks: v.rocks || savedLvl.rocks,
            lavaZones: v.lavaZones || savedLvl.lavaZones,
            lavaPaths: v.lavaPaths || savedLvl.lavaPaths,
          };
        } else {
          merged[num] = v;
        }
      }
      setLevels(merged);
    }
    if (profile.rover) {
      const coins = profile.coins ?? profile.rover.coins ?? profile.rover.dust ?? 0;
      const pointsSpent = profile.pointsSpent ?? profile.rover.pointsSpent ?? 0;
      const totalPointsEarned = profile.totalPointsEarned ?? profile.rover.totalPointsEarned ?? (coins + pointsSpent);
      const unlockedSkins = Array.isArray(profile.rover.unlockedSkins) && profile.rover.unlockedSkins.length > 0 ? profile.rover.unlockedSkins : ['classic'];
      const unlockedWheels = Array.isArray(profile.rover.unlockedWheels) && profile.rover.unlockedWheels.length > 0 ? profile.rover.unlockedWheels : ['standard'];
      const unlockedLights = Array.isArray(profile.rover.unlockedLights) && profile.rover.unlockedLights.length > 0 ? profile.rover.unlockedLights : ['cyan'];
      const unlockedTrails = Array.isArray(profile.rover.unlockedTrails) && profile.rover.unlockedTrails.length > 0 ? profile.rover.unlockedTrails : ['none', 'dust'];
      const customization = profile.rover.customization || {
        skin: 'classic',
        wheel: 'standard',
        light: 'cyan',
        trail: 'dust',
      };

      setRover({
        ...defaultRoverState,
        ...profile.rover,
        coins,
        pointsSpent,
        totalPointsEarned,
        unlockedSkins,
        unlockedWheels,
        unlockedLights,
        unlockedTrails,
        customization,
        tunedSpeedLevel: profile.rover.tunedSpeedLevel ?? 0,
        tunedArmorLevel: profile.rover.tunedArmorLevel ?? 0,
        tunedBatteryLevel: profile.rover.tunedBatteryLevel ?? 0,
        tunedSolarLevel: profile.rover.tunedSolarLevel ?? 0,
        headlightsOn: profile.rover.headlightsOn !== false,
        health: typeof profile.rover.health === 'number' && !isNaN(profile.rover.health) ? profile.rover.health : 100,
        maxHealth: typeof profile.rover.maxHealth === 'number' && !isNaN(profile.rover.maxHealth) ? profile.rover.maxHealth : 100,
      });
    }
    setHasSaveData(true);
  }, []);

  // Commander Selected or Registered from Gatekeeper
  const handleCommanderConfirmed = useCallback(
    (profile: CharacterProfile) => {
      applyProfileToState(profile);
      setIsCommanderGateOpen(false);
      setIsAuthModalOpen(false);
      setShowCleanerModal(false);
      playSound('upgrade');
      const coins = profile.coins ?? profile.rover?.coins ?? 0;
      const spent = profile.pointsSpent ?? profile.rover?.pointsSpent ?? 0;
      showRadioMessage(
        `Commander ${profile.name} verified! Points: ${coins.toLocaleString()} Available • ${spent.toLocaleString()} Spent.`
      );
    },
    [applyProfileToState, playSound, showRadioMessage]
  );

  // Login or Register Character Pilot (Legacy fallback)
  const handleSelectOrRegisterPilot = useCallback(
    (name: string) => {
      const { profile, isNew } = loginOrRegisterProfile(name);
      handleCommanderConfirmed(profile);
    },
    [handleCommanderConfirmed]
  );

  // Reset Active Character Profile (Settings option)
  const handleResetActiveCharacter = useCallback(() => {
    if (!activeProfile) return;
    const resetData = resetCharacterProfile(activeProfile.id);
    applyProfileToState(resetData);
    playSound('hazard');
    showRadioMessage(`Commander ${resetData.name}'s telemetry and progress have been reset to Day 1.`);
  }, [activeProfile, applyProfileToState, playSound, showRadioMessage]);

  // Initialize or check Character profile on mount with server sync
  useEffect(() => {
    syncProfilesWithServer().then((all) => {
      const activeId = getActiveProfileId();
      let profile = activeId ? all.find((p) => p.id === activeId) || getProfile(activeId) : null;
      if (profile) {
        applyProfileToState(profile);
      } else if (all.length > 0) {
        applyProfileToState(all[0]);
      }
    });
  }, [applyProfileToState]);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key shortcuts if focus is inside any text input or editable field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      keysRef.current[e.key.toLowerCase()] = true;

      // DO NOT trigger in-game shortcuts if game is not running, is paused, in story modal, or in gatekeeper
      if (!isGameRunning || isPaused || showStoryModal || isCommanderGateOpen) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((prev) => !prev);
      }
      if (e.key === 'e' || e.key === 'E') {
        handleInteract();
      }
      if (e.key === ' ') {
        handleRadarScan();
      }
      if (e.key === 'r' || e.key === 'R') {
        // Solar Dust Removal ONLY during active gameplay!
        setShowCleanerModal(true);
      }
      if (e.key === 'h' || e.key === 'H') {
        handleToggleHeadlights();
      }
      if (e.key === 'v' || e.key === 'V') {
        setCameraMode((prev) => (prev === 'chase' ? 'topdown' : prev === 'topdown' ? 'cockpit' : 'chase'));
        playSound('click');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
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
    if (isDrillingActiveRef.current || isDrillingSample) return;

    const curTargets = curLevel.targets;
    for (const t of curTargets) {
      const dist = Math.hypot(rover.x - t.x, rover.y - t.y);
      if (dist < 75) {
        if (t.type === 'station') {
          // Check if this station's upgrade has ALREADY been installed
          const isL1Done = rover.upgrades?.duneTreads;
          const isL2Done = rover.upgrades?.iceRadar;
          const isL3Done = rover.upgrades?.stormShield;
          const isL4Done = rover.upgrades?.lavaPlates;
          const isL5Done = rover.upgrades?.quantumUplink;

          const alreadyUpgraded =
            (currentLevelNum === 1 && isL1Done) ||
            (currentLevelNum === 2 && isL2Done) ||
            (currentLevelNum === 3 && isL3Done) ||
            (currentLevelNum === 4 && isL4Done) ||
            (currentLevelNum === 5 && isL5Done);

          if (alreadyUpgraded) {
            playSound('ping');
            showRadioMessage('Workshop Upgrade already installed! System operating at peak performance.');
            return;
          }

          playSound('click');
          if (currentLevelNum === 1) setShowMinigame1(true);
          else if (currentLevelNum === 2) setShowMinigame2(true);
          else if (currentLevelNum === 3) setShowMinigame3(true);
          else if (currentLevelNum === 4) setShowMinigame4(true);
          else if (currentLevelNum === 5) setShowMinigame5(true);
          return;
        }

        if (t.type === 'sample') {
          if (t.collected) {
            playSound('ping');
            showRadioMessage(`Sample core from ${t.name} has already been extracted.`);
            return;
          }

          // Trigger 1-second drilling arm animation and coring audio (ONCE ONLY)
          isDrillingActiveRef.current = true;
          setIsDrillingSample(true);
          setDrillingProgress(0);
          playSound('drill');
          showRadioMessage(`Robotic drill arm deployed! Extracting core from ${t.name}...`);

          const startTime = performance.now();
          const drillDuration = 1000; // Exact 1-second duration

          const drillInterval = window.setInterval(() => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1.0, elapsed / drillDuration);
            setDrillingProgress(progress);

            if (progress >= 1.0) {
              window.clearInterval(drillInterval);
              isDrillingActiveRef.current = false;
              setIsDrillingSample(false);
              setDrillingProgress(0);
              playSound('sample');

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

              setRover((prev) => ({
                ...prev,
                sciencePoints: prev.sciencePoints + 60,
                coins: (prev.coins ?? prev.dust ?? 0) + 120,
              }));
              showRadioMessage(`Core extraction successful! +120 Coins & +60 SP gained from ${t.name}.`);
            }
          }, 30);

          return;
        }

        if (t.type === 'relay') {
          const alreadyTransmitted = curLevel.objectives.some(
            (obj) =>
              (obj.id === 'transmit' ||
                obj.id === 'reachTower' ||
                obj.id === 'geoGenerator' ||
                obj.id === 'quantumArray') &&
              obj.done
          );

          if (alreadyTransmitted) {
            playSound('ping');
            showRadioMessage('Relay transmission already complete! Data link is verified and active.');
            return;
          }

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

          setRover((prev) => ({
            ...prev,
            sciencePoints: prev.sciencePoints + 80,
            coins: (prev.coins ?? prev.dust ?? 0) + 150,
          }));
          showRadioMessage(
            currentLevelNum === 4
              ? 'Geothermal Power Generator activated! Infinite clean energy tapped from the lava chasm.'
              : currentLevelNum === 5
              ? 'Deep Space Quantum Uplink locked! Direct high-bandwidth transmission routed to Earth.'
              : 'Relay Transmission Complete! Direct data uplink to Earth verified.'
          );
          return;
        }

        if (t.type === 'settlement') {
          if (t.marked) {
            playSound('ping');
            showRadioMessage('Settlement Zone Alpha is already surveyed and marked.');
            return;
          }

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
  }, [curLevel, rover.x, rover.y, currentLevelNum, playSound, showRadioMessage, isDrillingSample, rover.upgrades]);

  // Main Game Physics Loop
  useEffect(() => {
    if (!isGameRunning || isPaused) return;

    let animId: number;

    const loop = () => {
      const curBiome = biomeTypes[curLevel.biome] || biomeTypes.basalt;
      
      // Dynamic evolution tier and tuning upgrades from points spent
      const tier = getTierForPointsSpent(rover.pointsSpent ?? 0);
      const tuningSpeedBonus = (rover.tunedSpeedLevel || 0) * 0.10 + tier.bonusSpeed;

      // Terrain-specific physics modifiers dynamically scaling with points invested
      let biomeAccel = (curBiome.accelMult ?? 1.0) * (1 + tuningSpeedBonus * 0.4);
      let biomeMaxForward = (curBiome.maxSpeed ?? 3.0) * (1 + tuningSpeedBonus);
      let biomeDrag = curBiome.drag ?? 0.88;
      let biomeTurnRate = curBiome.turnRate ?? 0.040;

      // Dunes upgrade synergy: Dune Treads overcome loose sand drag
      if (curLevel.biome === 'dunes') {
        if (rover.upgrades?.duneTreads) {
          biomeAccel *= 1.35;
          biomeMaxForward = 3.0;
          biomeDrag = 0.84;
          biomeTurnRate = 0.038;
        }
      }

      // Ice Cap physics: radar aids traction control
      if (curLevel.biome === 'ice') {
        if (rover.upgrades?.iceRadar) {
          biomeTurnRate *= 1.15;
        }
      }

      setRover((prev) => {
        let { x, y, angle, speed, battery, dust, health = 100, maxHealth = 100 } = prev;
        const keys = keysRef.current;
        const touch = touchDirectionRef.current;

        const isMovingForward = keys['w'] || keys['arrowup'] || touch.up;
        const isMovingBackward = keys['s'] || keys['arrowdown'] || touch.down;
        const isTurningLeft = keys['a'] || keys['arrowleft'] || touch.left;
        const isTurningRight = keys['d'] || keys['arrowright'] || touch.right;

        // Steering angle for wheel rotation (-1 for left, +1 for right, 0 for straight)
        let steering = 0;
        if (isTurningLeft) steering -= 1;
        if (isTurningRight) steering += 1;

        const accelStep = 0.12 * biomeAccel;

        if (isDrillingSample) {
          // Stationary while drilling sample core
          speed = 0;
        } else if (isMovingForward) {
          speed = Math.min(speed + accelStep, biomeMaxForward);
          playSound('drive');
        } else if (isMovingBackward) {
          speed = Math.max(speed - accelStep, -biomeMaxForward * 0.5);
        } else {
          speed *= biomeDrag;
        }

        if (isTurningLeft) angle -= biomeTurnRate;
        if (isTurningRight) angle += biomeTurnRate;

        // Realistic Momentum & Terrain Drift (especially on ice)
        let vx = prev.vx || 0;
        let vy = prev.vy || 0;
        const forwardVx = Math.cos(angle) * speed;
        const forwardVy = Math.sin(angle) * speed;

        if (curLevel.biome === 'ice') {
          // Ice has low lateral grip - slide in previous velocity vector
          vx = vx * 0.93 + forwardVx * 0.07;
          vy = vy * 0.93 + forwardVy * 0.07;
          x += vx;
          y += vy;
        } else {
          vx = forwardVx;
          vy = forwardVy;
          x += forwardVx;
          y += forwardVy;
        }

        // Natural Mountain Range Boundary Collisions & Physical Rebound
        const mountainMargin = 55;
        if (
          x <= mountainMargin ||
          x >= curLevel.mapWidth - mountainMargin ||
          y <= mountainMargin ||
          y >= curLevel.mapHeight - mountainMargin
        ) {
          if (Math.abs(speed) > 0.8 && Date.now() - lastRockHitTimeRef.current > 300) {
            lastRockHitTimeRef.current = Date.now();
            playSound('impact');
            speed = -speed * 0.35; // Kinetic rebound off steep mountain rock face
          }
        }
        x = Math.max(mountainMargin, Math.min(curLevel.mapWidth - mountainMargin, x));
        y = Math.max(mountainMargin, Math.min(curLevel.mapHeight - mountainMargin, y));

        // 1. Rock Obstacle Collision & Kinetic Damage Physics
        const activeRocks = curLevel.rocks || levels[currentLevelNum]?.rocks || [];
        if (activeRocks.length > 0) {
          const roverRadius = 26; // Chassis collision boundary
          for (const rock of activeRocks) {
            const dx = x - rock.x;
            const dy = y - rock.y;
            const dist = Math.hypot(dx, dy);
            const minDist = rock.radius + roverRadius;

            if (dist < minDist && dist > 0.0001) {
              // Push rover out along normal
              const nx = dx / dist;
              const ny = dy / dist;
              x = rock.x + nx * minDist;
              y = rock.y + ny * minDist;

              const now = Date.now();
              const impactSpeed = Math.abs(speed);

              // ALWAYS inflict structural damage upon colliding with boulders/rocks
              if (now - lastRockHitTimeRef.current > 240) {
                lastRockHitTimeRef.current = now;
                const dmg = Math.min(35, Math.max(8, Math.round(Math.max(impactSpeed, 0.6) * 6.5)));
                health = Math.max(0, health - dmg);
                speed = -speed * 0.45; // Inelastic kinetic rebound

                setLastCollisionTrigger(now);
                playSound('impact');

                triggerDangerAlert(
                  `COLLISION ALERT: IMPACT WITH ROCK OBSTACLE!`,
                  `STRUCTURAL INTEGRITY DECREASED BY -${dmg} HP [HULL: ${Math.round(health)}%]`,
                  'rock'
                );

                if (health <= 0) {
                  health = 0;
                  speed = 0;
                  vx = 0;
                  vy = 0;
                  playSound('alarm');
                  speakText("Game over! Start a new mission.");
                  setIsGameOver(true);
                  setIsPaused(true);
                  triggerDangerAlert(
                    `HULL INTEGRITY COMPROMISED (0/100)`,
                    `MISSION FAILED • GAME OVER! START A NEW MISSION.`,
                    'critical',
                    6000
                  );
                }
              }
              break;
            }
          }
        }

        // 2. Lava Hazard Thermal Heat & Hull Melt Physics
        if (curLevel.lavaZones && curLevel.lavaZones.length > 0) {
          const inLava = isPointInLava(x, y, curLevel);
          setInLavaHazard(inLava);

          if (inLava) {
            // Extreme thermal heat environment!
            const hasPlates = prev.upgrades.lavaPlates;
            const healthLoss = hasPlates ? 0.08 : 0.22;
            health = Math.max(0, health - healthLoss);

            const drainRate = hasPlates ? 0.015 : 0.055;
            battery = Math.max(0, battery - drainRate);
            speed *= hasPlates ? 0.94 : 0.85;

            // Trigger signature danger alert at bottom
            const now = Date.now();
            if (now - lastLavaAlertTimeRef.current > 1800) {
              lastLavaAlertTimeRef.current = now;
              triggerDangerAlert(
                `CRITICAL THERMAL HAZARD: MOLTEN LAVA DETECTED!`,
                `HULL HEAT ABLATION (-${hasPlates ? '4' : '12'} HP/s) • RETREAT TO BASALT BRIDGE!`,
                'lava',
                2000
              );
            }

            // Occasional hazard audio tick
            if (Math.random() < 0.025) {
              playSound('hazard');
            }

            // Emergency thermal rescue if hull destroyed or battery drained in lava
            if (health <= 0) {
              health = 0;
              speed = 0;
              vx = 0;
              vy = 0;
              playSound('alarm');
              speakText("Game over! Start a new mission.");
              setIsGameOver(true);
              setIsPaused(true);
              triggerDangerAlert(
                `THERMAL MELTDOWN: HULL INTEGRITY 0/100`,
                `MISSION FAILED • GAME OVER! START A NEW MISSION.`,
                'critical',
                6000
              );
            } else if (battery <= 0) {
              playSound('alarm');
              const safePt = getNearestSafePathPoint(x, y, curLevel);
              x = safePt.x;
              y = safePt.y;
              speed = 0;
              battery = 30;
              triggerDangerAlert(
                `BATTERY PURGE: ROVER RETRIEVED!`,
                `RETRIEVED TO NEAREST SAFE BASALT BRIDGE`,
                'critical',
                3500
              );
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
          vx,
          vy,
          angle,
          speed,
          battery,
          dust,
          health,
          maxHealth,
          steering,
          solarEff: 100 - dust,
        };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameRunning, isPaused, curLevel, rover.upgrades.duneTreads, rover.upgrades.lavaPlates, currentLevelNum, isDrillingSample, playSound, showRadioMessage, triggerDangerAlert]);

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
        coins: (prev.coins ?? prev.dust ?? 0) + 350,
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
    // PRESERVE ALL POINTS AND GARAGE ITEMS FOR THE COMMANDER!
    const currentCoins = rover.coins ?? activeProfile?.coins ?? 0;
    const currentSpent = rover.pointsSpent ?? activeProfile?.pointsSpent ?? 0;
    const currentEarned = rover.totalPointsEarned ?? activeProfile?.totalPointsEarned ?? (currentCoins + currentSpent);
    const unlockedSkins = rover.unlockedSkins || activeProfile?.rover?.unlockedSkins || ['classic'];
    const unlockedWheels = rover.unlockedWheels || activeProfile?.rover?.unlockedWheels || ['standard'];
    const unlockedLights = rover.unlockedLights || activeProfile?.rover?.unlockedLights || ['cyan'];
    const unlockedTrails = rover.unlockedTrails || activeProfile?.rover?.unlockedTrails || ['none', 'dust'];
    const customization = rover.customization || activeProfile?.rover?.customization || {
      skin: 'classic',
      wheel: 'standard',
      light: 'cyan',
      trail: 'dust',
    };
    const tunedSpeedLevel = rover.tunedSpeedLevel ?? activeProfile?.rover?.tunedSpeedLevel ?? 0;
    const tunedArmorLevel = rover.tunedArmorLevel ?? activeProfile?.rover?.tunedArmorLevel ?? 0;
    const tunedBatteryLevel = rover.tunedBatteryLevel ?? activeProfile?.rover?.tunedBatteryLevel ?? 0;
    const tunedSolarLevel = rover.tunedSolarLevel ?? activeProfile?.rover?.tunedSolarLevel ?? 0;

    const initialLevels = getInitialLevels();
    const startPos = initialLevels[1].startPos;

    setCurrentLevelNum(1);
    setLevels(initialLevels);
    setDiscoveries([]);

    const newSessionRover: RoverState = {
      ...defaultRoverState,
      x: startPos.x,
      y: startPos.y,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      health: 100,
      maxHealth: 100 + tunedArmorLevel * 20,
      battery: 100,
      solarEff: 100,
      dust: 0, // Dust starts completely clean at 0
      coins: currentCoins, // Points are fully retained!
      pointsSpent: currentSpent, // Spent points preserved!
      totalPointsEarned: currentEarned,
      tunedSpeedLevel,
      tunedArmorLevel,
      tunedBatteryLevel,
      tunedSolarLevel,
      unlockedSkins, // Garage purchases preserved!
      unlockedWheels,
      unlockedLights,
      unlockedTrails,
      customization,
      headlightsOn: true,
      sciencePoints: Math.max(100, rover.sciencePoints || 100),
    };

    setRover(newSessionRover);
    setShowCleanerModal(false); // DO NOT OPEN DUST CLEANER ON LOADING/START!

    if (activeProfile) {
      const updatedProfile: CharacterProfile = {
        ...activeProfile,
        coins: currentCoins,
        pointsSpent: currentSpent,
        totalPointsEarned: currentEarned,
        currentLevelNum: 1,
        lastPlayedAt: new Date().toISOString(),
        rover: newSessionRover,
        discoveries: [],
        levels: initialLevels,
      };
      saveProfile(updatedProfile);
      setActiveProfile(updatedProfile);
      setHasSaveData(true);
    }

    playSound('upgrade');
    showRadioMessage(
      `New Mission Initiated: Level 1 Basalt Canyon. Commander ${activeProfile?.name || 'Ayaan'} retains ${currentCoins.toLocaleString()} Points and all Workshop Upgrades!`
    );
    setIsFreeRoamMode(false);
    setShowStoryModal(true);
  };

  // Game Over Handlers
  const handleRestartMissionFromGameOver = useCallback(() => {
    setIsGameOver(false);
    setIsPaused(false);
    const startPos = curLevel.startPos;
    setRover((prev) => ({
      ...prev,
      x: startPos.x,
      y: startPos.y,
      vx: 0,
      vy: 0,
      speed: 0,
      health: 100,
      maxHealth: Math.max(100, prev.maxHealth || 100),
      battery: 100,
      dust: 0,
      solarEff: 100,
    }));
    playSound('upgrade');
    triggerDangerAlert(
      'MISSION RESTARTED: HULL 100/100',
      'Structural chassis integrity restored to 100/100.',
      'repaired',
      3500
    );
  }, [curLevel.startPos, playSound, triggerDangerAlert]);

  const handleMainMenuFromGameOver = useCallback(() => {
    setIsGameOver(false);
    setIsGameRunning(false);
    setIsPaused(false);
  }, []);

  // Launch rover mission from briefing
  const handleStartMissionFromBriefing = useCallback(() => {
    setShowMissionBriefing(false);
    setShowCleanerModal(false);
    setIsGameRunning(true);
    setIsPaused(false);
    saveGameState();
    showRadioMessage(`Mission launched in ${curLevel.subtitle}. Drive safely!`);
  }, [curLevel.subtitle, saveGameState, showRadioMessage]);

  const handleStartFreeRoam = useCallback(() => {
    setIsFreeRoamMode(true);
    const freeLevel = getFreeRoamLevel();
    setLevels((prev) => ({
      ...prev,
      0: freeLevel,
    }));
    setCurrentLevelNum(0);
    setShowCleanerModal(false);
    setRover((prev) => ({
      ...prev,
      x: freeLevel.startPos.x,
      y: freeLevel.startPos.y,
      speed: 0,
      dust: 0,
      solarEff: 100,
      battery: 100,
      health: 100,
      maxHealth: Math.max(100, prev.maxHealth || 100),
    }));
    playSound('whoosh');
    setShowMissionBriefing(true);
  }, [playSound]);

  const handleTeleportToBiome = useCallback(
    (targetLevelNum: number, targetIsFreeRoam?: boolean) => {
      setShowBiomeTeleportModal(false);
      if (targetIsFreeRoam || targetLevelNum === 0) {
        handleStartFreeRoam();
        return;
      }
      setIsFreeRoamMode(false);
      const targetLvl = levels[targetLevelNum] || getInitialLevels()[targetLevelNum];
      setCurrentLevelNum(targetLevelNum);
      setShowCleanerModal(false);
      setRover((prev) => ({
        ...prev,
        x: targetLvl.startPos.x,
        y: targetLvl.startPos.y,
        speed: 0,
        dust: 0,
        solarEff: 100,
        battery: 100,
        health: 100,
        maxHealth: Math.max(100, prev.maxHealth || 100),
      }));
      playSound('whoosh');
      setShowMissionBriefing(true);
    },
    [handleStartFreeRoam, levels, playSound]
  );

  const handleResumeGame = () => {
    if (activeProfile) {
      applyProfileToState(activeProfile);
    }
    setShowCleanerModal(false);
    setShowMissionBriefing(true);
  };

  const handleStartGameFromStory = () => {
    setShowStoryModal(false);
    setShowCleanerModal(false);
    setRover((prev) => ({
      ...prev,
      dust: 0,
      solarEff: 100,
      health: 100,
      maxHealth: Math.max(100, prev.maxHealth || 100),
    }));
    setShowMissionBriefing(true);
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
        health: 100,
        maxHealth: Math.max(100, prev.maxHealth || 100),
      }));
      saveGameState();
      setShowMissionBriefing(true);
      triggerDangerAlert('BIOME TRANSITION: CHASSIS PREPARED', 'Hull integrity restored to 100/100 for next expedition.', 'repaired');
      if (nextLvl === 4) {
        setShowLavaBridgeModal(true);
      }
    } else {
      // FINAL CHAPTER CONQUERED: Launch 10-Year Epilogue Animation!
      setShowTenYearsLaterModal(true);
      showRadioMessage('10 YEARS LATER: Humanity celebrates the permanent populating of Earth and Mars!');
    }
  };

  // Minigame completion callbacks (Only awards upgrade and coins ONCE)
  const handleCompleteM1 = () => {
    setShowMinigame1(false);
    if (rover.upgrades?.duneTreads) {
      playSound('ping');
      showRadioMessage('Sand Dune Treads are already installed and active.');
      return;
    }
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, duneTreads: true },
      sciencePoints: prev.sciencePoints + 75,
      coins: (prev.coins ?? prev.dust ?? 0) + 150,
      health: 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[1].objectives = next[1].objectives.map((o) =>
        o.id === 'upgrade1' ? { ...o, done: true } : o
      );
      return next;
    });
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Sand Dune Treads online! High dune traction enabled (+150 Coins).');
    triggerDangerAlert('SYSTEM REPAIRED: CHASSIS 100% HP', 'Workshop technicians reinforced titanium frame and treads.', 'repaired');
    saveGameState();
  };

  const handleCompleteM2 = () => {
    setShowMinigame2(false);
    if (rover.upgrades?.iceRadar) {
      playSound('ping');
      showRadioMessage('Subsurface Wave Radar is already installed and active.');
      return;
    }
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, iceRadar: true },
      sciencePoints: prev.sciencePoints + 75,
      coins: (prev.coins ?? prev.dust ?? 0) + 150,
      health: 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[2].objectives = next[2].objectives.map((o) =>
        o.id === 'upgrade2' ? { ...o, done: true } : o
      );
      return next;
    });
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Subsurface Wave Radar active! Ready to locate buried ice (+150 Coins).');
    triggerDangerAlert('SYSTEM REPAIRED: CHASSIS 100% HP', 'Subsurface radar installed and structural hull recalibrated.', 'repaired');
    saveGameState();
  };

  const handleCompleteM3 = () => {
    setShowMinigame3(false);
    if (rover.upgrades?.stormShield) {
      playSound('ping');
      showRadioMessage('Volcanic Storm Shielding is already installed and active.');
      return;
    }
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, stormShield: true },
      sciencePoints: prev.sciencePoints + 75,
      coins: (prev.coins ?? prev.dust ?? 0) + 175,
      health: 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[3].objectives = next[3].objectives.map((o) =>
        o.id === 'upgrade3' ? { ...o, done: true } : o
      );
      return next;
    });
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Volcanic Storm Shielding online! High heat resistance active (+175 Coins).');
    triggerDangerAlert('SYSTEM REPAIRED: CHASSIS 100% HP', 'Volcanic storm shield online and titanium plates reinforced.', 'repaired');
    saveGameState();
  };

  const handleCompleteM4 = () => {
    setShowMinigame4(false);
    if (rover.upgrades?.lavaPlates) {
      playSound('ping');
      showRadioMessage('Ceramic Lava Heat Plates are already installed and active.');
      return;
    }
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, lavaPlates: true },
      sciencePoints: prev.sciencePoints + 85,
      coins: (prev.coins ?? prev.dust ?? 0) + 200,
      health: 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[4].objectives = next[4].objectives.map((o) =>
        o.id === 'upgrade4' ? { ...o, done: true } : o
      );
      return next;
    });
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Ceramic Lava Heat Plates active! Extreme magma tolerance enabled (+200 Coins).');
    triggerDangerAlert('SYSTEM REPAIRED: CHASSIS 100% HP', 'Ceramic heat tiles mounted and thermal insulation upgraded.', 'repaired');
    saveGameState();
  };

  const handleCompleteLavaBridge = () => {
    setShowLavaBridgeModal(false);
    const isBridgeDone = levels[4]?.objectives.some(
      (o) => (o.id === 'buildBridge' || o.id === 'upgrade4') && o.done
    );
    if (isBridgeDone && rover.upgrades?.lavaPlates) {
      playSound('ping');
      showRadioMessage('Lava Causeway Bridge is already secured and operational.');
      return;
    }
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, lavaPlates: true },
      sciencePoints: prev.sciencePoints + 120,
      coins: (prev.coins ?? prev.dust ?? 0) + 250,
      health: 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      if (next[4]) {
        next[4].objectives = next[4].objectives.map((o) =>
          o.id === 'buildBridge' || o.id === 'upgrade4' ? { ...o, done: true } : o
        );
      }
      return next;
    });
    playSound('upgrade');
    showRadioMessage('Lava Causeway Bridge operational! Basalt pylons secured over molten magma chasm (+250 Coins).');
    triggerDangerAlert(
      'LAVA CAUSEWAY CONSTRUCTED',
      'Structural bridge pylons secured • Thermal plates installed (100% HP)',
      'repaired'
    );
    saveGameState();
  };

  const handleCompleteM5 = () => {
    setShowMinigame5(false);
    if (rover.upgrades?.quantumUplink) {
      playSound('ping');
      showRadioMessage('Deep Space Quantum Uplink is already installed and active.');
      return;
    }
    setRover((prev) => ({
      ...prev,
      upgrades: { ...prev.upgrades, quantumUplink: true },
      sciencePoints: prev.sciencePoints + 100,
      coins: (prev.coins ?? prev.dust ?? 0) + 250,
      health: 100,
    }));
    setLevels((prevL) => {
      const next = { ...prevL };
      next[5].objectives = next[5].objectives.map((o) =>
        o.id === 'upgrade5' ? { ...o, done: true } : o
      );
      return next;
    });
    playSound('upgrade');
    showRadioMessage('Upgrade Installed: Deep Space Quantum Uplink online! High-bandwidth communications verified (+250 Coins).');
    triggerDangerAlert('SYSTEM REPAIRED: CHASSIS 100% HP', 'Quantum transceiver mounted and hull integrity certified.', 'repaired');
    saveGameState();
  };

  const handleFinishCleaning = (cleanedDust: number) => {
    setRover((prev) => ({
      ...prev,
      dust: cleanedDust,
      solarEff: 100 - cleanedDust,
      sciencePoints: prev.sciencePoints + 25,
      coins: (prev.coins ?? prev.dust ?? 0) + 75,
      health: Math.min(100, (prev.health || 100) + 20),
    }));
    setShowCleanerModal(false);
    playSound('clean');
    showRadioMessage('Solar panels wiped clean! Power generation efficiency restored.');
    triggerDangerAlert('FIELD MAINTENANCE: +20 HP REPAIRED', 'Solar dust purge cleared radiator cooling channels.', 'repaired');
  };

  // Customization Garage Buy & Equip
  const handleEquipCosmetic = (category: keyof RoverCustomization, id: string) => {
    setRover((prev) => {
      const updatedRover: RoverState = {
        ...prev,
        customization: {
          ...prev.customization,
          [category]: id,
        },
      };
      saveGameState(updatedRover);
      return updatedRover;
    });
    playSound('clean');
  };

  const handleBuyCosmetic = (
    category: keyof RoverCustomization,
    id: string,
    cost: number
  ) => {
    const currentPoints = rover.coins ?? rover.dust ?? 0;
    const currentSP = rover.sciencePoints ?? 0;
    if (currentPoints < cost && currentSP < cost) {
      showRadioMessage(`Insufficient Points! You need ${cost} points.`);
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

      const updatedCoins = Math.max(0, (prev.coins ?? prev.dust ?? 0) - cost);
      const updatedSP = Math.max(0, (prev.sciencePoints ?? 0) - cost);
      const updatedSpent = (prev.pointsSpent ?? 0) + cost;
      const updatedUnlocked = Array.from(new Set([...(prev[unlockedKey] || []), id]));

      const updatedRover: RoverState = {
        ...prev,
        coins: updatedCoins,
        sciencePoints: updatedSP,
        pointsSpent: updatedSpent,
        [unlockedKey]: updatedUnlocked,
        customization: {
          ...prev.customization,
          [category]: id,
        },
      };

      saveGameState(updatedRover);
      return updatedRover;
    });
    playSound('upgrade');
    showRadioMessage(`Unlocked and equipped ${id}! Points spent: ${cost}.`);
  };

  const handleTuneRover = (
    type: 'speed' | 'armor' | 'battery' | 'solar' | 'repair',
    cost: number
  ) => {
    const currentCoins = rover.coins ?? rover.dust ?? 0;
    if (currentCoins < cost) {
      showRadioMessage(`Insufficient Points! You need ${cost} points to tune this tech.`);
      return;
    }

    setRover((prev) => {
      const updatedCoins = Math.max(0, (prev.coins ?? prev.dust ?? 0) - cost);
      const updatedSpent = (prev.pointsSpent ?? 0) + cost;

      let tunedSpeedLevel = prev.tunedSpeedLevel || 0;
      let tunedArmorLevel = prev.tunedArmorLevel || 0;
      let tunedBatteryLevel = prev.tunedBatteryLevel || 0;
      let tunedSolarLevel = prev.tunedSolarLevel || 0;
      let health = prev.health;
      let maxHealth = prev.maxHealth || 100;
      let dust = prev.dust;
      let solarEff = prev.solarEff;
      let battery = prev.battery;

      if (type === 'speed') {
        tunedSpeedLevel = Math.min(5, tunedSpeedLevel + 1);
      } else if (type === 'armor') {
        tunedArmorLevel = Math.min(5, tunedArmorLevel + 1);
        maxHealth += 20;
        health = Math.min(maxHealth, health + 25);
      } else if (type === 'battery') {
        tunedBatteryLevel = Math.min(5, tunedBatteryLevel + 1);
        battery = 100;
      } else if (type === 'solar') {
        tunedSolarLevel = Math.min(5, tunedSolarLevel + 1);
        solarEff = Math.min(100, solarEff + 15);
      } else if (type === 'repair') {
        health = Math.min(maxHealth, health + 40);
        dust = 0;
        solarEff = 100;
      }

      const updatedRover: RoverState = {
        ...prev,
        coins: updatedCoins,
        pointsSpent: updatedSpent,
        tunedSpeedLevel,
        tunedArmorLevel,
        tunedBatteryLevel,
        tunedSolarLevel,
        health,
        maxHealth,
        battery,
        dust,
        solarEff,
      };

      saveGameState(updatedRover);
      return updatedRover;
    });

    playSound('upgrade');
    showRadioMessage(`Tech upgrade installed! Rover parameters augmented. Points Spent: ${cost}.`);
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
        playSound={playSound}
        cameraMode={cameraMode}
        isDrillingSample={isDrillingSample}
        drillingProgress={drillingProgress}
        lastCollisionTrigger={lastCollisionTrigger}
      />

      {/* HUD Layer (active when running and not in title) */}
      {isGameRunning && (
        <HUDOverlay
          currentLevel={curLevel}
          rover={rover}
          activeSkin={activeSkin}
          activePilotName={activeProfile?.name || 'Ayaan'}
          isAresUser={isAresProfile(activeProfile?.id) || isAresProfile(activeProfile?.name)}
          currentObjectiveText={currentObjectiveText}
          radioSubtitleText={radioSubtitle}
          nearInteractive={nearInteractive}
          inLavaHazard={inLavaHazard}
          dangerAlert={dangerAlert}
          cameraMode={cameraMode}
          isDrillingSample={isDrillingSample}
          drillingProgress={drillingProgress}
          onSetCameraMode={setCameraMode}
          onPause={() => setIsPaused(true)}
          onRadarScan={handleRadarScan}
          onToggleHeadlights={handleToggleHeadlights}
          onOpenTeleportModal={() => setShowBiomeTeleportModal(true)}
          onSwitchPilot={() => setIsCommanderGateOpen(true)}
          onOpenCleaner={() => setShowCleanerModal(true)}
          onOpenUpgradeLab={() => {
            if (currentLevelNum === 1) setShowMinigame1(true);
            else if (currentLevelNum === 2) setShowMinigame2(true);
            else if (currentLevelNum === 3) setShowMinigame3(true);
            else if (currentLevelNum === 4) setShowLavaBridgeModal(true);
            else if (currentLevelNum === 5) setShowMinigame5(true);
          }}
          onOpenLavaBridge={() => setShowLavaBridgeModal(true)}
          onOpenGarage={() => setShowGarageModal(true)}
          onOpenScienceLog={() => setShowScienceLog(true)}
          onTouchDirection={(dir, pressed) => {
            touchDirectionRef.current[dir] = pressed;
          }}
          onTouchInteract={handleInteract}
        />
      )}

      {/* Title Screen Modal */}
      {!isGameRunning && !showStoryModal && (
        <TitleScreen
          hasSaveData={hasSaveData}
          saveSummaryText={
            isFreeRoamMode
              ? 'MARS FREE ROAM EXPLORATION'
              : `LEVEL ${currentLevelNum} - ${curLevel.subtitle.toUpperCase()}`
          }
          activePilotName={activeProfile?.name || 'Ayaan'}
          activePilotCoins={rover.coins ?? activeProfile?.coins ?? 0}
          activePilotPointsSpent={rover.pointsSpent ?? activeProfile?.pointsSpent ?? 0}
          activePilotTierBadge={getTierForPointsSpent(rover.pointsSpent ?? activeProfile?.pointsSpent ?? 0).badge}
          onOpenCharacterModal={() => setIsCommanderGateOpen(true)}
          onResume={handleResumeGame}
          onNewGame={handleStartNewGame}
          onStartFreeRoam={handleStartFreeRoam}
          onWatchStoryVideo={() => setShowStoryModal(true)}
          onOpenPhysics={() => setShowPhysicsLab(true)}
          onOpenGarage={() => setShowGarageModal(true)}
          audioEnabled={audioEnabled}
          setAudioEnabled={setAudioEnabled}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
        />
      )}

      {/* Cinematic Story Video Modal */}
      <StoryCinematicModal
        isOpen={showStoryModal}
        onFinish={handleStartGameFromStory}
        onSceneChange={(text) => speakText(text)}
        playSound={playSound}
        speakText={speakText}
        audioEnabled={audioEnabled}
      />

      {/* Commander Choice Gatekeeper: Shown before Main Menu to choose NEW or OLD player */}
      <CommanderSelectionGate
        isOpen={isCommanderGateOpen}
        activeProfile={activeProfile}
        canCancel={!!activeProfile && isGameRunning}
        onCommanderSelected={handleCommanderConfirmed}
        onCancel={() => setIsCommanderGateOpen(false)}
      />

      {/* Character Profile Modal (Legacy / Quick-Switch) */}
      <CharacterAuthModal
        isOpen={isAuthModalOpen}
        activeProfile={activeProfile}
        canCancel={!!activeProfile}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectOrRegister={handleCommanderConfirmed}
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

      <LavaBridgeBuilderModal
        isOpen={showLavaBridgeModal}
        onClose={() => setShowLavaBridgeModal(false)}
        onComplete={handleCompleteLavaBridge}
        playSound={playSound}
      />

      <QuantumUplinkModal
        isOpen={showMinigame5}
        onClose={() => setShowMinigame5(false)}
        onComplete={handleCompleteM5}
      />

      {/* Solar Cleaner Mini-Activity: STRICTLY restricted to active running gameplay, never during loading screen or gatekeeper */}
      <SolarCleanerModal
        isOpen={showCleanerModal && isGameRunning && !showStoryModal && !isCommanderGateOpen && !isPaused}
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
        coins={rover.coins ?? activeProfile?.coins ?? 0}
        pointsSpent={rover.pointsSpent ?? activeProfile?.pointsSpent ?? 0}
        rover={rover}
        unlockedSkins={rover.unlockedSkins}
        unlockedWheels={rover.unlockedWheels}
        unlockedLights={rover.unlockedLights}
        unlockedTrails={rover.unlockedTrails}
        onEquip={handleEquipCosmetic}
        onBuy={handleBuyCosmetic}
        onTuneRover={handleTuneRover}
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
        activePilotName={activeProfile?.name || 'Ayaan'}
        isAresUser={isAresProfile(activeProfile?.id) || isAresProfile(activeProfile?.name)}
        onResume={() => setIsPaused(false)}
        onSave={() => {
          saveGameState();
          showRadioMessage(`Mission telemetry saved for Commander ${activeProfile?.name || 'Ayaan'}.`);
        }}
        onWatchStoryVideo={() => {
          setIsPaused(false);
          setShowStoryModal(true);
        }}
        onOpenPhysics={() => setShowPhysicsLab(true)}
        onResetCharacter={handleResetActiveCharacter}
        onSwitchPilot={() => {
          setIsPaused(false);
          setIsCommanderGateOpen(true);
        }}
        onOpenTeleportModal={() => setShowBiomeTeleportModal(true)}
        onMainMenu={() => {
          saveGameState();
          setIsGameRunning(false);
          setIsPaused(false);
        }}
      />

      {/* A.R.E.S. Biome Teleportation Modal */}
      <BiomeTeleportModal
        isOpen={showBiomeTeleportModal}
        currentLevelNum={currentLevelNum}
        isFreeRoamMode={isFreeRoamMode}
        onClose={() => setShowBiomeTeleportModal(false)}
        onTeleport={handleTeleportToBiome}
      />

      {/* Biome Complete Celebration Modal */}
      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNum={currentLevelNum}
        totalDiscoveries={discoveries.length}
        batteryRemaining={rover.battery}
        onProceed={handleProceedToNextLevel}
      />

      {/* 10 Years Later Epilogue: Humans Populating Earth & Mars */}
      <TenYearsLaterModal
        isOpen={showTenYearsLaterModal}
        onClose={() => setShowTenYearsLaterModal(false)}
        onRestartGame={() => {
          setShowTenYearsLaterModal(false);
          handleStartNewGame();
        }}
        speakText={speakText}
        playSound={playSound}
      />

      {/* Game Over Modal when health drops to 0 */}
      <GameOverModal
        isOpen={isGameOver}
        activePilotName={activeProfile?.name || 'Commander'}
        currentLevelNum={currentLevelNum}
        onRestartMission={handleRestartMissionFromGameOver}
        onMainMenu={handleMainMenuFromGameOver}
        onReplayVoice={() => speakText("Game over! Start a new mission.")}
      />

      {/* Easy & Simple Mission Briefing Before Every Map Opens */}
      <MissionBriefingModal
        isOpen={showMissionBriefing}
        levelNum={currentLevelNum}
        levelConfig={curLevel}
        onStartMission={handleStartMissionFromBriefing}
        onOpenHudDemo={() => setShowHudDemo(true)}
      />

      {/* HUD & Screen Items Demo Guide for Map 1 */}
      <HudDemoModal
        isOpen={showHudDemo}
        onClose={() => setShowHudDemo(false)}
        onStartMission={() => {
          setShowHudDemo(false);
          handleStartMissionFromBriefing();
        }}
      />
    </div>
  );
}
