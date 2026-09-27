import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { LevelConfig, RoverState, SkinItem, WheelItem, LightItem, TrailItem } from '../types';
import { SoundType } from '../hooks/useSoundEffects';
import marsPanoramaImg from '../assets/images/mars_horizon_panorama_1789980994159.jpg';
import {
  getTerrainHeight,
  calculateRoverSuspension,
  getLevelCraters,
  CraterDef,
} from '../utils/terrain';

export type CameraMode = 'chase' | 'topdown' | 'cockpit';

interface GameCanvasProps {
  currentLevel: LevelConfig;
  rover: RoverState;
  skin: SkinItem;
  wheel: WheelItem;
  light: LightItem;
  trail: TrailItem;
  radarPulseTrigger: number;
  inLavaHazard?: boolean;
  playSound?: (type: SoundType) => void;
  cameraMode: CameraMode;
  isDrillingSample?: boolean;
  drillingProgress?: number;
  lastCollisionTrigger?: number;
}

// Ballistic particle for realistic lava explosion
interface LavaParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  rotSpeed: number;
}

// Smoke particle for rising ash
interface SmokeParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scaleGrowth: number;
}

// Trail particle behind rover wheels
interface WheelTrailParticle {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

// Drill spark particle
interface DrillSparkParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface SteerHolders {
  FL: THREE.Group | null;
  FR: THREE.Group | null;
  RL: THREE.Group | null;
  RR: THREE.Group | null;
  ML: THREE.Group | null;
  MR: THREE.Group | null;
}

interface RoboticArmObjects {
  armGroup: THREE.Group | null;
  shoulder: THREE.Group | null;
  elbow: THREE.Group | null;
  wrist: THREE.Group | null;
  drillGroup: THREE.Group | null;
  drillBit: THREE.Mesh | null;
  chuck: THREE.Mesh | null;
}

interface TargetVisualRef {
  name: string;
  crystals: THREE.Mesh[];
  ring: THREE.Mesh;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentLevel,
  rover,
  skin,
  wheel,
  light,
  trail,
  radarPulseTrigger,
  inLavaHazard = false,
  playSound,
  cameraMode,
  isDrillingSample = false,
  drillingProgress = 0,
  lastCollisionTrigger = 0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roverGroupRef = useRef<THREE.Group | null>(null);
  const wheelMeshesRef = useRef<THREE.Mesh[]>([]);
  const solarPanelMeshRef = useRef<THREE.Mesh | null>(null);
  const headlightSpot1Ref = useRef<THREE.SpotLight | null>(null);
  const headlightSpot2Ref = useRef<THREE.SpotLight | null>(null);
  const headlightBeamsRef = useRef<THREE.Mesh[]>([]);
  const headlightBulbsRef = useRef<THREE.Mesh[]>([]);

  // Corner Wheel Steering Pivots
  const steerHoldersRef = useRef<SteerHolders>({
    FL: null,
    FR: null,
    RL: null,
    RR: null,
    ML: null,
    MR: null,
  });
  const steerAngleRef = useRef<number>(0);

  // Articulated Robotic Drill Arm
  const roboticArmRef = useRef<RoboticArmObjects>({
    armGroup: null,
    shoulder: null,
    elbow: null,
    wrist: null,
    drillGroup: null,
    drillBit: null,
    chuck: null,
  });

  // Dynamic particle & FX arrays
  const lavaParticlesRef = useRef<LavaParticle[]>([]);
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const wheelTrailsRef = useRef<WheelTrailParticle[]>([]);
  const drillSparksRef = useRef<DrillSparkParticle[]>([]);
  const shockwaveMeshRef = useRef<THREE.Mesh | null>(null);
  const explosionLightRef = useRef<THREE.PointLight | null>(null);
  const radarRingMeshRef = useRef<THREE.Mesh | null>(null);
  const targetVisualsRef = useRef<TargetVisualRef[]>([]);
  const levelCratersRef = useRef<CraterDef[]>([]);

  // Camera shake trauma
  const cameraTraumaRef = useRef<number>(0);
  const prevLavaHazardRef = useRef<boolean>(false);
  const lastLavaSizzleTimeRef = useRef<number>(0);

  // Realistic 3D Terrain & Suspension Physics State Refs
  const roverYRef = useRef<number>(0);
  const roverPitchRef = useRef<number>(0);
  const roverRollRef = useRef<number>(0);
  const prevRoverSpeedRef = useRef<number>(0);
  const travelDistanceRef = useRef<number>(0);

  // Props synchronization refs for animation loop
  const roverPropsRef = useRef(rover);
  roverPropsRef.current = rover;

  const currentLevelPropsRef = useRef(currentLevel);
  currentLevelPropsRef.current = currentLevel;

  const inLavaHazardPropsRef = useRef(inLavaHazard);
  inLavaHazardPropsRef.current = inLavaHazard;

  const cameraModePropsRef = useRef(cameraMode);
  cameraModePropsRef.current = cameraMode;

  const isDrillingPropsRef = useRef(isDrillingSample);
  isDrillingPropsRef.current = isDrillingSample;

  const drillingProgPropsRef = useRef(drillingProgress);
  drillingProgPropsRef.current = drillingProgress;

  // TRIGGER REALISTIC LAVA BOOM EXPLOSION
  const triggerRealisticLavaBoom = useCallback(
    (x: number, z: number, intensity: number = 1.0) => {
      const scene = sceneRef.current;
      if (!scene) return;

      // 1. Play sound
      if (playSound) {
        playSound('boom');
        playSound('hazard');
      }

      // 2. Camera shake trauma
      cameraTraumaRef.current = Math.min(1.4, cameraTraumaRef.current + 1.1 * intensity);

      // 3. Flash explosion PointLight
      if (explosionLightRef.current) {
        explosionLightRef.current.position.set(x, 15, z);
        explosionLightRef.current.intensity = 35 * intensity;
        explosionLightRef.current.color.setHex(0xff7700);
      }

      // 4. Expanding fiery shockwave ring
      if (shockwaveMeshRef.current) {
        shockwaveMeshRef.current.position.set(x, 0.4, z);
        shockwaveMeshRef.current.scale.set(1, 1, 1);
        shockwaveMeshRef.current.visible = true;
        const mat = shockwaveMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.95;
      }

      // 5. Spawn 100+ molten lava globules with ballistic physics
      const count = Math.floor(100 * intensity);
      const sphereGeo = new THREE.SphereGeometry(1.2, 8, 8);
      const colors = [0xffd54f, 0xff9100, 0xff3d00, 0xff1744, 0xffffff];

      for (let i = 0; i < count; i++) {
        const col = colors[Math.floor(Math.random() * colors.length)];
        const mat = new THREE.MeshBasicMaterial({ color: col });
        const mesh = new THREE.Mesh(sphereGeo, mat);

        mesh.position.set(
          x + (Math.random() - 0.5) * 16,
          0.5 + Math.random() * 3,
          z + (Math.random() - 0.5) * 16
        );
        mesh.scale.setScalar(0.7 + Math.random() * 1.5);
        scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 45;
        const vy = 28 + Math.random() * 55 * intensity;

        lavaParticlesRef.current.push({
          mesh,
          vx: Math.cos(angle) * speed,
          vy,
          vz: Math.sin(angle) * speed,
          life: 0,
          maxLife: 1.2 + Math.random() * 1.4,
          rotSpeed: (Math.random() - 0.5) * 15,
        });
      }

      // 6. Spawn billowing volcanic smoke column
      const smokeCount = Math.floor(40 * intensity);
      const smokeGeo = new THREE.DodecahedronGeometry(3.5, 1);

      for (let s = 0; s < smokeCount; s++) {
        const smokeMat = new THREE.MeshStandardMaterial({
          color: 0x1a0f0d,
          roughness: 0.9,
          transparent: true,
          opacity: 0.75,
        });
        const mesh = new THREE.Mesh(smokeGeo, smokeMat);
        mesh.position.set(
          x + (Math.random() - 0.5) * 12,
          2 + Math.random() * 4,
          z + (Math.random() - 0.5) * 12
        );
        scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 14;

        smokeParticlesRef.current.push({
          mesh,
          vx: Math.cos(angle) * speed,
          vy: 12 + Math.random() * 25,
          vz: Math.sin(angle) * speed,
          life: 0,
          maxLife: 1.8 + Math.random() * 1.5,
          scaleGrowth: 1.05 + Math.random() * 0.08,
        });
      }
    },
    [playSound]
  );

  // Monitor entering lava hazard to trigger explosion
  useEffect(() => {
    if (inLavaHazard && !prevLavaHazardRef.current) {
      triggerRealisticLavaBoom(rover.x, rover.y, 1.2);
    }
    prevLavaHazardRef.current = inLavaHazard;
  }, [inLavaHazard, rover.x, rover.y, triggerRealisticLavaBoom]);

  // Handle Radar Pulse Trigger in 3D
  useEffect(() => {
    if (radarPulseTrigger > 0 && radarRingMeshRef.current) {
      radarRingMeshRef.current.position.set(rover.x, 0.3, rover.y);
      radarRingMeshRef.current.scale.set(1, 1, 1);
      radarRingMeshRef.current.visible = true;
      const mat = radarRingMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.9;
    }
  }, [radarPulseTrigger, rover.x, rover.y]);

  // Handle Rock Collision Impact Trauma & Sparks
  const prevCollisionTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (lastCollisionTrigger && lastCollisionTrigger !== prevCollisionTriggerRef.current) {
      prevCollisionTriggerRef.current = lastCollisionTrigger;
      cameraTraumaRef.current = Math.min(1.0, cameraTraumaRef.current + 0.65);
      if (sceneRef.current) {
        const angle = rover.angle;
        const sparkX = rover.x + Math.cos(angle) * 16;
        const sparkZ = rover.y + Math.sin(angle) * 16;
        for (let i = 0; i < 16; i++) {
          const sparkGeo = new THREE.SphereGeometry(0.9 + Math.random() * 0.9, 6, 6);
          const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
          const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
          sparkMesh.position.set(sparkX, 5 + Math.random() * 8, sparkZ);
          sceneRef.current.add(sparkMesh);
          const spAngle = Math.random() * Math.PI * 2;
          const spSpeed = 35 + Math.random() * 65;
          drillSparksRef.current.push({
            mesh: sparkMesh,
            vx: Math.cos(spAngle) * spSpeed,
            vy: 20 + Math.random() * 35,
            vz: Math.sin(spAngle) * spSpeed,
            life: 0,
            maxLife: 0.35 + Math.random() * 0.25,
          });
        }
      }
    }
  }, [lastCollisionTrigger, rover.angle, rover.x, rover.y]);

  // CREATE PROCEDURAL BIOME TEXTURE
  const createBiomeTexture = (biome: string, mapW: number, mapH: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    if (biome === 'basalt') {
      ctx.fillStyle = '#872115';
      ctx.fillRect(0, 0, 1024, 1024);

      for (let i = 0; i < 6000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? '#5A160E' : '#B83A28';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let c = 0; c < 8; c++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 1024;
        const cr = 40 + Math.random() * 90;
        ctx.strokeStyle = '#3E0F0A';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#D9534F';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else if (biome === 'dunes') {
      ctx.fillStyle = '#C26A1B';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#E67E22';
      ctx.lineWidth = 6;
      for (let y = 0; y < 1024; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(256, y + 16, 768, y - 16, 1024, y);
        ctx.stroke();
      }

      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? '#F39C12' : '#934C0A';
        ctx.fillRect(x, y, 2, 2);
      }
    } else if (biome === 'ice') {
      ctx.fillStyle = '#90CAF9';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      for (let f = 0; f < 15; f++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
        ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
        ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
        ctx.stroke();
      }

      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? '#E1F5FE' : '#4DD0E1';
        ctx.fillRect(x, y, 3, 3);
      }
    } else if (biome === 'volcanic') {
      ctx.fillStyle = '#210B07';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 4;
      for (let v = 0; v < 12; v++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
        ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
        ctx.stroke();
      }
    } else if (biome === 'lava') {
      ctx.fillStyle = '#1A1D20';
      ctx.fillRect(0, 0, 1024, 1024);

      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? '#2D3748' : '#0F1114';
        ctx.fillRect(x, y, 2, 2);
      }
    } else {
      ctx.fillStyle = '#311B45';
      ctx.fillRect(0, 0, 1024, 1024);

      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? '#4A2368' : '#1F0F2D';
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(mapW / 250, mapH / 250);
    return texture;
  };

  // BUILD THE DETAILED 3D ROVER MODEL WITH ARTICULATED DRILL ARM AND 4-CORNER STEERING PIVOTS
  const buildRoverModel = (
    skinCol: string,
    wheelCol: string,
    rimCol: string,
    lightCol: string
  ): {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    solarPanel: THREE.Mesh;
    steerHolders: SteerHolders;
    roboticArm: RoboticArmObjects;
  } => {
    const roverGroup = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    const wheelRadius = 6.5;
    const wheelWidth = 5.0;

    const chassisWidth = 26;
    const chassisLength = 40;
    const chassisHeight = 12;

    // 1. Chassis Body (Warm Electronics Box - WEB) with MLI Thermal Blanket Panels
    const chassisGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLength);
    const skinColorObj = new THREE.Color(skinCol);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: skinColorObj,
      roughness: 0.25,
      metalness: 0.35,
      emissive: skinColorObj.clone().multiplyScalar(0.22),
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.set(0, 14, 0);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    roverGroup.add(chassisMesh);

    // Warm Gold/Kapton Foil Thermal Insulation Side Blankets (Perseverance style)
    const foilMat = new THREE.MeshStandardMaterial({
      color: 0xdfab37,
      roughness: 0.35,
      metalness: 0.75,
    });
    const foilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, chassisHeight - 2, chassisLength - 6), foilMat);
    foilLeft.position.set(-(chassisWidth / 2 + 0.3), 14, 0);
    roverGroup.add(foilLeft);

    const foilRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, chassisHeight - 2, chassisLength - 6), foilMat);
    foilRight.position.set(chassisWidth / 2 + 0.3, 14, 0);
    roverGroup.add(foilRight);

    // Dedicated rover highlight luminary so customized skin colorways always shine clearly
    const roverFillLight = new THREE.PointLight(0xffffff, 2.5, 95);
    roverFillLight.position.set(0, 32, 0);
    roverGroup.add(roverFillLight);

    // Chassis structural titanium frame & lower bumper
    const trimGeo = new THREE.BoxGeometry(chassisWidth + 2, 3, chassisLength + 2);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0.5 });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.set(0, 10, 0);
    roverGroup.add(trimMesh);

    // Underside Belly Pan & Cylindrical Sample Tube Carousel Cache
    const bellyGeo = new THREE.BoxGeometry(chassisWidth - 4, 2, chassisLength - 8);
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0, 7.5, 0);
    roverGroup.add(bellyMesh);

    const sampleTubeGeo = new THREE.CylinderGeometry(0.7, 0.7, 9, 8);
    const sampleTubeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    for (let i = -2; i <= 2; i++) {
      const tube = new THREE.Mesh(sampleTubeGeo, sampleTubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(i * 2.2, 7.2, -6);
      roverGroup.add(tube);
    }

    // 2. Solar Panel Deck (on top of chassis at y = 20.5)
    const solarGeo = new THREE.BoxGeometry(chassisWidth - 2, 1, chassisLength - 6);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.85,
    });
    const solarMesh = new THREE.Mesh(solarGeo, solarMat);
    solarMesh.position.set(0, 20.5, 0);
    solarMesh.castShadow = true;
    roverGroup.add(solarMesh);

    // Mars 2020 Sundial & Color Calibration Target on Deck
    const calibDialGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.6, 16);
    const calibDialMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, metalness: 0.3 });
    const calibDial = new THREE.Mesh(calibDialGeo, calibDialMat);
    calibDial.position.set(-6, 21.2, 6);
    roverGroup.add(calibDial);

    const gnomonPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.5 })
    );
    gnomonPost.position.set(-6, 22.3, 6);
    roverGroup.add(gnomonPost);

    // Rear MMRTG (Multi-Mission Radioisotope Thermoelectric Generator) Nuclear Power System
    const rtgGroup = new THREE.Group();
    rtgGroup.position.set(0, 18, (chassisLength / 2) + 3);
    rtgGroup.rotation.x = 0.35; // Tilted upward at authentic NASA angle

    const rtgCoreGeo = new THREE.CylinderGeometry(3.5, 3.5, 11, 16);
    const rtgCoreMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
    const rtgCore = new THREE.Mesh(rtgCoreGeo, rtgCoreMat);
    rtgCore.rotation.x = Math.PI / 2;
    rtgGroup.add(rtgCore);

    // 8 Graphite Heat Radiator Cooling Fins
    const finGeo = new THREE.BoxGeometry(0.4, 3.5, 10.5);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0.1 });
    for (let f = 0; f < 8; f++) {
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.z = (f * Math.PI) / 4;
      rtgGroup.add(fin);
    }

    const capGeo = new THREE.CylinderGeometry(3.8, 3.8, 1.2, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.rotation.x = Math.PI / 2;
    capMesh.position.z = 5.8;
    rtgGroup.add(capMesh);

    roverGroup.add(rtgGroup);

    // 3. Rocker-Bogie Suspension Linkage (Titanium Tubes)
    const suspensionMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
    
    // Left & Right Rocker Arms
    const rockerGeo = new THREE.CylinderGeometry(1.2, 1.2, 28, 8);
    rockerGeo.rotateZ(Math.PI / 2);

    const leftRocker = new THREE.Mesh(rockerGeo, suspensionMat);
    leftRocker.position.set(-(chassisWidth / 2 + 2.5), 11, 0);
    leftRocker.rotation.y = 0.1;
    roverGroup.add(leftRocker);

    const rightRocker = new THREE.Mesh(rockerGeo, suspensionMat);
    rightRocker.position.set(chassisWidth / 2 + 2.5, 11, 0);
    rightRocker.rotation.y = -0.1;
    roverGroup.add(rightRocker);

    // Differential Pivot Crossbar Housing on Chassis
    const diffPivotGeo = new THREE.CylinderGeometry(2.0, 2.0, chassisWidth + 6, 12);
    diffPivotGeo.rotateZ(Math.PI / 2);
    const diffPivot = new THREE.Mesh(diffPivotGeo, suspensionMat);
    diffPivot.position.set(0, 13, 0);
    roverGroup.add(diffPivot);

    // 6 NASA-Grade Rocker-Bogie Aluminum Wheels with Chevron Grousers
    const steerHolders: SteerHolders = {
      FL: null,
      FR: null,
      RL: null,
      RR: null,
      ML: null,
      MR: null,
    };

    const wheelOffsets = [
      { id: 'FL', x: -(chassisWidth / 2 + 4.5), z: -14, steerable: true },
      { id: 'ML', x: -(chassisWidth / 2 + 4.5), z: 0, steerable: false },
      { id: 'RL', x: -(chassisWidth / 2 + 4.5), z: 14, steerable: true },
      { id: 'FR', x: chassisWidth / 2 + 4.5, z: -14, steerable: true },
      { id: 'MR', x: chassisWidth / 2 + 4.5, z: 0, steerable: false },
      { id: 'RR', x: chassisWidth / 2 + 4.5, z: 14, steerable: true },
    ];

    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wheelCol),
      roughness: 0.75,
      metalness: 0.35,
    });

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.58, wheelRadius * 0.58, wheelWidth + 0.6, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(rimCol),
      roughness: 0.25,
      metalness: 0.85,
    });

    const hubMotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.35, wheelRadius * 0.35, wheelWidth + 1.2, 12);
    const hubMotorMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 });

    wheelOffsets.forEach((off) => {
      const wheelHolder = new THREE.Group();
      wheelHolder.position.set(off.x, wheelRadius, off.z);

      const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wMesh.rotation.z = Math.PI / 2;
      wMesh.castShadow = true;
      wheelHolder.add(wMesh);

      const rMesh = new THREE.Mesh(rimGeo, rimMat);
      rMesh.rotation.z = Math.PI / 2;
      wheelHolder.add(rMesh);

      const hubMesh = new THREE.Mesh(hubMotorGeo, hubMotorMat);
      hubMesh.rotation.z = Math.PI / 2;
      wheelHolder.add(hubMesh);

      // Curved Traction Grousers (NASA Mars Rover Tread Cleats)
      const grouserGeo = new THREE.BoxGeometry(wheelWidth - 0.4, 0.6, 1.0);
      const grouserMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(rimCol), metalness: 0.7 });
      for (let g = 0; g < 10; g++) {
        const gMesh = new THREE.Mesh(grouserGeo, grouserMat);
        const theta = (g * Math.PI * 2) / 10;
        gMesh.position.set(0, Math.cos(theta) * (wheelRadius + 0.15), Math.sin(theta) * (wheelRadius + 0.15));
        gMesh.rotation.x = -theta;
        wMesh.add(gMesh);
      }

      // Vertical Steering Kingpin / Strut Bracket
      const strutGeo = new THREE.CylinderGeometry(1.4, 1.4, 9, 8);
      const strutMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8 });
      const strutMesh = new THREE.Mesh(strutGeo, strutMat);
      strutMesh.position.set(off.x > 0 ? -2.5 : 2.5, 3.5, 0);
      strutMesh.rotation.z = off.x > 0 ? 0.35 : -0.35;
      wheelHolder.add(strutMesh);

      roverGroup.add(wheelHolder);
      wheels.push(wMesh);

      if (off.id === 'FL') steerHolders.FL = wheelHolder;
      else if (off.id === 'FR') steerHolders.FR = wheelHolder;
      else if (off.id === 'RL') steerHolders.RL = wheelHolder;
      else if (off.id === 'RR') steerHolders.RR = wheelHolder;
      else if (off.id === 'ML') steerHolders.ML = wheelHolder;
      else if (off.id === 'MR') steerHolders.MR = wheelHolder;
    });

    // 4. Remote Sensing Mast (RSM) with Mastcam-Z & SuperCam (Front Deck at -Z)
    const mastNeckGeo = new THREE.CylinderGeometry(1.2, 1.6, 16, 8);
    const mastNeckMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85 });
    const mastNeck = new THREE.Mesh(mastNeckGeo, mastNeckMat);
    mastNeck.position.set(0, 27, -12);
    mastNeck.castShadow = true;
    roverGroup.add(mastNeck);

    const mastHeadGeo = new THREE.BoxGeometry(8.5, 4.5, 5.5);
    const mastHeadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
    const mastHead = new THREE.Mesh(mastHeadGeo, mastHeadMat);
    mastHead.position.set(0, 35, -12);
    roverGroup.add(mastHead);

    // SuperCam Circular Laser Telescope on Mast Top
    const superCamGeo = new THREE.CylinderGeometry(2.0, 2.0, 2.5, 16);
    const superCamMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const superCam = new THREE.Mesh(superCamGeo, superCamMat);
    superCam.position.set(0, 38, -12);
    roverGroup.add(superCam);

    // Stereo lenses facing -Z (forward)
    const lensGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.6, 16);
    const lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(lightCol) });

    const lensL = new THREE.Mesh(lensGeo, lensMat);
    lensL.rotation.x = Math.PI / 2;
    lensL.position.set(-2.5, 35, -15);
    roverGroup.add(lensL);

    const lensR = new THREE.Mesh(lensGeo, lensMat);
    lensR.rotation.x = Math.PI / 2;
    lensR.position.set(2.5, 35, -15);
    roverGroup.add(lensR);

    // MEDA Meteorological Sensor Booms projecting sideways
    const medaArmGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 6);
    medaArmGeo.rotateZ(Math.PI / 2);
    const medaArmMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const medaL = new THREE.Mesh(medaArmGeo, medaArmMat);
    medaL.position.set(-4.5, 30, -12);
    roverGroup.add(medaL);

    // 5. Parabolic High-Gain Antenna Dish (Rear Deck at +Z) & UHF Antenna
    const dishGeo = new THREE.ConeGeometry(5.8, 3.2, 16, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.2 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(6, 25, 10);
    dish.rotation.x = -0.55;
    roverGroup.add(dish);

    const dishFeed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    dishFeed.position.set(6, 26, 10);
    dishFeed.rotation.x = -0.55;
    roverGroup.add(dishFeed);

    // UHF Omnidirectional Orbiter Relay Antenna Mast
    const uhfGeo = new THREE.CylinderGeometry(0.4, 0.6, 15, 8);
    const uhfMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const uhf = new THREE.Mesh(uhfGeo, uhfMat);
    uhf.position.set(-7, 27, 12);
    roverGroup.add(uhf);

    // Front Hazcams (Hazard Avoidance Cameras)
    const hazcamMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const frontHazcamL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), hazcamMat);
    frontHazcamL.position.set(-6, 10, -20.5);
    roverGroup.add(frontHazcamL);

    const frontHazcamR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), hazcamMat);
    frontHazcamR.position.set(6, 10, -20.5);
    roverGroup.add(frontHazcamR);

    // 6. Forward High-Output Headlights & Volumetric Light Beams (Pointing directly forward towards -Z)
    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 5, -280);
    roverGroup.add(headlightTarget);

    // Forward Spotlights with wide throw and high penetration
    const spot1 = new THREE.SpotLight(new THREE.Color(lightCol), 8.5, 480, Math.PI / 4.0, 0.45);
    spot1.position.set(-6, 20, -16);
    spot1.target = headlightTarget;
    spot1.castShadow = true;
    roverGroup.add(spot1);
    headlightSpot1Ref.current = spot1;

    const spot2 = new THREE.SpotLight(new THREE.Color(lightCol), 8.5, 480, Math.PI / 4.0, 0.45);
    spot2.position.set(6, 20, -16);
    spot2.target = headlightTarget;
    spot2.castShadow = true;
    roverGroup.add(spot2);
    headlightSpot2Ref.current = spot2;

    // Glowing headlight bulb bezels
    const bulbGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const bulbMat1 = new THREE.MeshBasicMaterial({ color: new THREE.Color(lightCol) });
    const bulbMat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(lightCol) });

    const bulb1 = new THREE.Mesh(bulbGeo, bulbMat1);
    bulb1.position.set(-6, 20, -17);
    roverGroup.add(bulb1);

    const bulb2 = new THREE.Mesh(bulbGeo, bulbMat2);
    bulb2.position.set(6, 20, -17);
    roverGroup.add(bulb2);

    headlightBulbsRef.current = [bulb1, bulb2];

    // High-visibility Volumetric Light Beam Cones cutting through Martian dust
    const beamGeo = new THREE.CylinderGeometry(2.0, 32, 240, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, -120);

    const beamMat1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(lightCol),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamMat2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(lightCol),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const beam1 = new THREE.Mesh(beamGeo, beamMat1);
    beam1.position.set(-6, 20, -17);
    roverGroup.add(beam1);

    const beam2 = new THREE.Mesh(beamGeo, beamMat2);
    beam2.position.set(6, 20, -17);
    roverGroup.add(beam2);

    headlightBeamsRef.current = [beam1, beam2];

    // 7. ARTICULATED SCIENTIFIC ROBOTIC ARM & ROTARY CORING DRILL
    const armGroup = new THREE.Group();
    armGroup.position.set(8.5, 13.5, -16); // Mounted on front-right bumper deck

    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const armSilverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });

    // Shoulder Base & Servo Turret
    const shoulderBaseGeo = new THREE.CylinderGeometry(2.2, 2.8, 3, 12);
    const shoulderBase = new THREE.Mesh(shoulderBaseGeo, darkMetalMat);
    armGroup.add(shoulderBase);

    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.6, 0);
    armGroup.add(shoulder);

    // Upper boom
    const upperBoomGeo = new THREE.BoxGeometry(2.4, 13, 2.4);
    const upperBoom = new THREE.Mesh(upperBoomGeo, armSilverMat);
    upperBoom.position.set(0, 6.5, 0);
    upperBoom.castShadow = true;
    shoulder.add(upperBoom);

    // Elbow joint
    const elbow = new THREE.Group();
    elbow.position.set(0, 13, 0);
    shoulder.add(elbow);

    const elbowMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.8, 12), darkMetalMat);
    elbowMesh.rotation.z = Math.PI / 2;
    elbow.add(elbowMesh);

    // Forearm boom
    const foreBoomGeo = new THREE.BoxGeometry(2.0, 12, 2.0);
    const foreBoom = new THREE.Mesh(foreBoomGeo, armSilverMat);
    foreBoom.position.set(0, 6, 0);
    foreBoom.castShadow = true;
    elbow.add(foreBoom);

    // Wrist joint
    const wrist = new THREE.Group();
    wrist.position.set(0, 12, 0);
    elbow.add(wrist);

    // Drill Group Assembly
    const drillGroup = new THREE.Group();
    wrist.add(drillGroup);

    // Rotary drill chuck motor
    const chuckGeo = new THREE.CylinderGeometry(2.2, 1.8, 5, 12);
    const chuck = new THREE.Mesh(chuckGeo, darkMetalMat);
    chuck.position.set(0, 2.5, 0);
    drillGroup.add(chuck);

    // PIXL / SHERLOC Spectrometer Sensor Cylinder on Turret
    const pixlSensor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 3.8, 10),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
    );
    pixlSensor.position.set(2.2, 2.2, 0);
    drillGroup.add(pixlSensor);

    // Tungsten carbide fluted coring drill bit
    const bitGeo = new THREE.ConeGeometry(1.5, 6.5, 8);
    const bitMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.1,
    });
    const drillBit = new THREE.Mesh(bitGeo, bitMat);
    drillBit.position.set(0, 7.5, 0);
    drillBit.rotation.x = Math.PI; // point downward when arm deployed
    drillGroup.add(drillBit);

    // Initial stowed resting position on front rover deck
    shoulder.rotation.x = -0.4;
    shoulder.rotation.z = 0.2;
    elbow.rotation.x = 2.4;
    wrist.rotation.x = -1.2;

    roverGroup.add(armGroup);

    const roboticArm: RoboticArmObjects = {
      armGroup,
      shoulder,
      elbow,
      wrist,
      drillGroup,
      drillBit,
      chuck,
    };

    return {
      group: roverGroup,
      wheels,
      solarPanel: solarMesh,
      steerHolders,
      roboticArm,
    };
  };

  // MAIN THREE.JS SETUP & SCENE CREATION
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const biomeColors: Record<string, { sky: number; ground: number; fog: number }> = {
      basalt: { sky: 0xff8a65, ground: 0x3e100c, fog: 0x872115 },
      dunes: { sky: 0xffb74d, ground: 0x4a2400, fog: 0xc26a1b },
      ice: { sky: 0xb3e5fc, ground: 0x01579b, fog: 0x64b5f6 },
      volcanic: { sky: 0xff7043, ground: 0x210b07, fog: 0x37120a },
      lava: { sky: 0xff5722, ground: 0x1a0500, fog: 0x2e0c05 },
      summit: { sky: 0xce93d8, ground: 0x1f0f2d, fog: 0x1f0b2e },
    };

    const curColors = biomeColors[currentLevel.biome] || biomeColors.basalt;
    scene.background = new THREE.Color(curColors.fog);
    scene.fog = new THREE.FogExp2(curColors.fog, 0.00035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 2, 10000);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight(curColors.sky, curColors.ground, 1.1);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff3e0, 1.65);
    dirLight.position.set(currentLevel.mapWidth * 0.4, 600, currentLevel.mapHeight * 0.3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 50;
    dirLight.shadow.camera.far = 1800;
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    // 5. Generate Deterministic Craters & High-Resolution Deformed Mars Surface Mesh
    const biomeLevelMap: Record<string, number> = {
      basalt: 1,
      dunes: 2,
      ice: 3,
      volcanic: 4,
      lava: 4,
      summit: 5,
    };
    const levelIndex = biomeLevelMap[currentLevel.biome] || 1;
    const craters = getLevelCraters(
      levelIndex,
      currentLevel.biome,
      currentLevel.mapWidth,
      currentLevel.mapHeight,
      currentLevel.startPos,
      currentLevel.targets
    );
    levelCratersRef.current = craters;

    // Subdivided ground mesh (120x120 quads) with physical height displacement for craters & bumps
    const segs = 120;
    const groundGeo = new THREE.PlaneGeometry(
      currentLevel.mapWidth,
      currentLevel.mapHeight,
      segs,
      segs
    );

    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const lx = posAttr.getX(i);
      const ly = posAttr.getY(i);
      // PlaneGeometry local coordinates to world coordinates:
      // Rotated -PI/2 around X: local X -> world X, local -Y -> world Z
      const wx = lx + currentLevel.mapWidth / 2;
      const wz = -ly + currentLevel.mapHeight / 2;
      const h = getTerrainHeight(
        wx,
        wz,
        currentLevel.biome,
        currentLevel.startPos,
        currentLevel.mapWidth,
        currentLevel.mapHeight,
        craters
      );
      // Local Z points upward in world space after rotation
      posAttr.setZ(i, h);
    }
    posAttr.needsUpdate = true;
    groundGeo.computeVertexNormals();

    const groundTexture = createBiomeTexture(
      currentLevel.biome,
      currentLevel.mapWidth,
      currentLevel.mapHeight
    );
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: false,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(currentLevel.mapWidth / 2, 0, currentLevel.mapHeight / 2);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 3D Visual Crater Formations: Dark Regolith Bowl Discs & Weathered Rim Ejecta Boulders
    const rimBoulderMat = new THREE.MeshStandardMaterial({
      color: curColors.ground,
      roughness: 0.92,
      metalness: 0.15,
      flatShading: true,
    });
    const ejectaGeo = new THREE.DodecahedronGeometry(1.6, 1);

    craters.forEach((crater, cIdx) => {
      // 1. Subtle inner crater depression floor darkening
      const innerDiscGeo = new THREE.CircleGeometry(crater.radius * 0.72, 20);
      const innerDiscMat = new THREE.MeshBasicMaterial({
        color: 0x070403,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
      innerDisc.rotation.x = -Math.PI / 2;
      const bowlH = getTerrainHeight(
        crater.x,
        crater.y,
        currentLevel.biome,
        currentLevel.startPos,
        currentLevel.mapWidth,
        currentLevel.mapHeight,
        craters
      );
      innerDisc.position.set(crater.x, bowlH + 0.08, crater.y);
      scene.add(innerDisc);

      // 2. Weathered crater rim ejecta boulders around the rim crest
      const rockCount = Math.floor(4 + ((cIdx * 7) % 5));
      for (let r = 0; r < rockCount; r++) {
        const angle = (r * Math.PI * 2) / rockCount + ((cIdx * 1.7) % Math.PI);
        const rx = crater.x + Math.cos(angle) * (crater.radius * (0.95 + ((r * 3) % 4) * 0.04));
        const rz = crater.y + Math.sin(angle) * (crater.radius * (0.95 + ((r * 3) % 4) * 0.04));
        const ry = getTerrainHeight(
          rx,
          rz,
          currentLevel.biome,
          currentLevel.startPos,
          currentLevel.mapWidth,
          currentLevel.mapHeight,
          craters
        );
        const bMesh = new THREE.Mesh(ejectaGeo, rimBoulderMat);
        const scale = 0.55 + ((r + cIdx) % 3) * 0.35;
        bMesh.scale.set(scale * 1.2, scale * 0.8, scale * 1.1);
        bMesh.position.set(rx, ry + scale * 0.6, rz);
        bMesh.rotation.set(r * 0.9, r * 1.4, cIdx * 0.5);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        scene.add(bMesh);
      }
    });

    // 6. Vast Outer Mars Terrain & Realistic Background Beyond The Drivable Area
    const outerGeo = new THREE.PlaneGeometry(16000, 16000);
    const outerMat = new THREE.MeshStandardMaterial({
      color: curColors.fog,
      roughness: 0.95,
      metalness: 0.05,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.set(currentLevel.mapWidth / 2, -0.2, currentLevel.mapHeight / 2);
    outerMesh.receiveShadow = true;
    scene.add(outerMesh);

    // Realistic Mars 360-degree Horizon Panorama Cylinder
    const textureLoader = new THREE.TextureLoader();
    const horizonTexture = textureLoader.load(marsPanoramaImg);
    horizonTexture.wrapS = THREE.RepeatWrapping;
    horizonTexture.wrapT = THREE.ClampToEdgeWrapping;
    horizonTexture.repeat.set(3, 1);

    const cylinderRadius = Math.max(currentLevel.mapWidth, currentLevel.mapHeight) * 1.6;
    const cylinderHeight = 1500;
    const horizonGeo = new THREE.CylinderGeometry(
      cylinderRadius,
      cylinderRadius,
      cylinderHeight,
      64,
      1,
      true
    );
    const horizonMat = new THREE.MeshBasicMaterial({
      map: horizonTexture,
      side: THREE.BackSide,
      fog: false,
    });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    horizonMesh.position.set(
      currentLevel.mapWidth / 2,
      cylinderHeight / 2 - 80,
      currentLevel.mapHeight / 2
    );
    scene.add(horizonMesh);

    // PERIMETER MOUNTAIN RANGES (Natural Boundary Mountains - No Rectangular Laser Fences)
    // Towering mountain ridges enclose the playable valley basin
    const mountainColors: Record<string, { ridge: number; peak: number; rough: number }> = {
      basalt: { ridge: 0x4a1811, peak: 0x6e2419, rough: 0.92 },
      dunes: { ridge: 0xa05218, peak: 0xcd6e24, rough: 0.94 },
      ice: { ridge: 0x37474f, peak: 0x78909c, rough: 0.75 },
      volcanic: { ridge: 0x210b07, peak: 0x42170f, rough: 0.95 },
      lava: { ridge: 0x1f1412, peak: 0x3d201c, rough: 0.93 },
      summit: { ridge: 0x3e2552, peak: 0x613c7d, rough: 0.88 },
    };
    const mCol = mountainColors[currentLevel.biome] || mountainColors.basalt;

    const mountainMat = new THREE.MeshStandardMaterial({
      color: mCol.ridge,
      roughness: mCol.rough,
      metalness: 0.15,
      flatShading: true,
    });

    const mountainPeakMat = new THREE.MeshStandardMaterial({
      color: mCol.peak,
      roughness: mCol.rough,
      metalness: 0.18,
      flatShading: true,
    });

    const w = currentLevel.mapWidth;
    const h = currentLevel.mapHeight;

    const addMountainMassif = (
      mx: number,
      mz: number,
      baseRadius: number,
      mHeight: number,
      sides: number = 6,
      castShadow: boolean = true
    ) => {
      const mGeo = new THREE.ConeGeometry(baseRadius, mHeight, sides);
      const mMesh = new THREE.Mesh(mGeo, mHeight > 110 ? mountainPeakMat : mountainMat);
      mMesh.position.set(mx, mHeight * 0.44, mz);
      mMesh.scale.set(1 + ((mx * 7) % 5) * 0.08, 1, 1 + ((mz * 11) % 5) * 0.08);
      mMesh.rotation.y = (mx * 13 + mz * 17) * 0.05;
      mMesh.castShadow = castShadow;
      mMesh.receiveShadow = true;
      scene.add(mMesh);
    };

    // 1. Inner Perimeter Foothill Ridges (Dense, continuous mountain ridge along the map borders)
    const mStep = 55;
    // North border (z near 0)
    for (let x = 0; x <= w; x += mStep) {
      const seed = (x * 37) % 100;
      const mz = 15 - (seed % 25);
      addMountainMassif(x, mz, 48 + (seed % 28), 65 + (seed % 50), 5 + (seed % 3), true);
    }
    // South border (z near h)
    for (let x = 0; x <= w; x += mStep) {
      const seed = (x * 43) % 100;
      const mz = h - 15 + (seed % 25);
      addMountainMassif(x, mz, 48 + (seed % 28), 65 + (seed % 50), 5 + (seed % 3), true);
    }
    // West border (x near 0)
    for (let z = 0; z <= h; z += mStep) {
      const seed = (z * 53) % 100;
      const mx = 15 - (seed % 25);
      addMountainMassif(mx, z, 48 + (seed % 28), 65 + (seed % 50), 5 + (seed % 3), true);
    }
    // East border (x near w)
    for (let z = 0; z <= h; z += mStep) {
      const seed = (z * 59) % 100;
      const mx = w - 15 + (seed % 25);
      addMountainMassif(mx, z, 48 + (seed % 28), 65 + (seed % 50), 5 + (seed % 3), true);
    }

    // 2. Colossal 4-Corner Mountain Bastions (Massive peaks anchoring the perimeter corners)
    const corners = [
      { x: -30, z: -30 },
      { x: w + 30, z: -30 },
      { x: -30, z: h + 30 },
      { x: w + 30, z: h + 30 },
    ];
    corners.forEach((c) => {
      addMountainMassif(c.x, c.z, 160, 220, 7, true);
      addMountainMassif(c.x + 35, c.z - 25, 120, 180, 6, true);
      addMountainMassif(c.x - 25, c.z + 35, 120, 180, 6, true);
    });

    // 3. Layered Outer Mountain Peaks Beyond the Valley Rim
    for (let b = 0; b < 65; b++) {
      const side = b % 4;
      let rx = 0;
      let rz = 0;
      const seed = b * 47;
      const distOut = 75 + (seed % 150);
      if (side === 0) {
        rx = (seed * 31) % w;
        rz = -distOut;
      } else if (side === 1) {
        rx = (seed * 31) % w;
        rz = h + distOut;
      } else if (side === 2) {
        rx = -distOut;
        rz = (seed * 31) % h;
      } else {
        rx = w + distOut;
        rz = (seed * 31) % h;
      }
      addMountainMassif(rx, rz, 80 + (seed % 65), 110 + (seed % 130), 6 + (seed % 3), false);
    }

    // 4. Talus Scree & Boulders along Mountain Base
    const screeGeo = new THREE.DodecahedronGeometry(12, 1);
    for (let s = 0; s < 50; s++) {
      const side = s % 4;
      let sx = 0;
      let sz = 0;
      const seed = s * 73;
      if (side === 0) {
        sx = (seed * 23) % w;
        sz = 28 + (seed % 20);
      } else if (side === 1) {
        sx = (seed * 23) % w;
        sz = h - 28 - (seed % 20);
      } else if (side === 2) {
        sx = 28 + (seed % 20);
        sz = (seed * 23) % h;
      } else {
        sx = w - 28 - (seed % 20);
        sz = (seed * 23) % h;
      }
      const sy = getTerrainHeight(sx, sz, currentLevel.biome, currentLevel.startPos, w, h, craters);
      const screeMesh = new THREE.Mesh(screeGeo, mountainMat);
      screeMesh.position.set(sx, sy + 5, sz);
      screeMesh.scale.set(1 + (seed % 3) * 0.4, 0.7 + (seed % 2) * 0.3, 1 + (seed % 4) * 0.3);
      screeMesh.rotation.set(seed * 0.3, seed * 0.7, seed * 0.5);
      screeMesh.castShadow = true;
      screeMesh.receiveShadow = true;
      scene.add(screeMesh);
    }

    // 7. Interactive Surface Rock Obstacles (Martian Boulders & Basalt Crags)
    if (currentLevel.rocks && currentLevel.rocks.length > 0) {
      const rockColors: Record<string, { main: number; alt: number; rough: number }> = {
        basalt: { main: 0x4a1811, alt: 0x2e0c06, rough: 0.88 },
        dunes: { main: 0xa05218, alt: 0x6e340a, rough: 0.94 },
        ice: { main: 0x546e7a, alt: 0x78909c, rough: 0.65 },
        lava: { main: 0x241714, alt: 0x160e0d, rough: 0.92 },
        summit: { main: 0x372549, alt: 0x241633, rough: 0.82 },
      };
      const rockPalette = rockColors[currentLevel.biome] || rockColors.basalt;

      currentLevel.rocks.forEach((rock, idx) => {
        const rockHeight = rock.height || rock.radius * 0.75;
        const shapeSeed = rock.shape || (idx + 1);
        const groundY = getTerrainHeight(
          rock.x,
          rock.y,
          currentLevel.biome,
          currentLevel.startPos,
          currentLevel.mapWidth,
          currentLevel.mapHeight,
          craters
        );

        // High-definition faceted Martian boulder geometry
        const geo = new THREE.DodecahedronGeometry(rock.radius, 1);
        const col = rock.color
          ? new THREE.Color(rock.color)
          : new THREE.Color(idx % 2 === 0 ? rockPalette.main : rockPalette.alt);

        const rMat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: rockPalette.rough,
          metalness: 0.15,
          flatShading: true,
        });

        const rMesh = new THREE.Mesh(geo, rMat);
        rMesh.scale.set(
          1 + (shapeSeed % 3) * 0.15,
          rockHeight / rock.radius,
          0.9 + (shapeSeed % 4) * 0.12
        );
        rMesh.position.set(rock.x, groundY + rockHeight * 0.45, rock.y);
        rMesh.rotation.set(shapeSeed * 0.65, shapeSeed * 1.25, shapeSeed * 0.4);
        rMesh.castShadow = true;
        rMesh.receiveShadow = true;
        scene.add(rMesh);

        // Scatter 2 smaller jagged satellite stones around boulder base
        const pebbleGeo = new THREE.DodecahedronGeometry(rock.radius * 0.24, 0);
        for (let p = 0; p < 2; p++) {
          const pAngle = shapeSeed * 1.7 + p * 2.5;
          const pDist = rock.radius * (1.15 + p * 0.28);
          const px = rock.x + Math.cos(pAngle) * pDist;
          const pz = rock.y + Math.sin(pAngle) * pDist;
          const pGroundY = getTerrainHeight(
            px,
            pz,
            currentLevel.biome,
            currentLevel.startPos,
            currentLevel.mapWidth,
            currentLevel.mapHeight,
            craters
          );
          const pebble = new THREE.Mesh(pebbleGeo, rMat);
          pebble.position.set(
            px,
            pGroundY + rock.radius * 0.1,
            pz
          );
          pebble.castShadow = true;
          pebble.receiveShadow = true;
          scene.add(pebble);
        }
      });
    }

    // 8. Molten Lava Zones & Solid Basalt Bridges (Cerberus Lava Chasm)
    if (currentLevel.lavaZones && currentLevel.lavaZones.length > 0) {
      currentLevel.lavaZones.forEach((lz) => {
        const lavaGeo = new THREE.PlaneGeometry(lz.width, lz.height);
        const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff3d00 });
        const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
        lavaMesh.rotation.x = -Math.PI / 2;
        lavaMesh.position.set(lz.x + lz.width / 2, 0.05, lz.y + lz.height / 2);
        scene.add(lavaMesh);

        const lavaGlow = new THREE.PointLight(0xff6d00, 3.5, 450);
        lavaGlow.position.set(lz.x + lz.width / 2, 25, lz.y + lz.height / 2);
        scene.add(lavaGlow);
      });
    }

    // Solid Basalt Bridges (Safe flat road at y = 0.25)
    if (currentLevel.lavaPaths && currentLevel.lavaPaths.length > 0) {
      const basaltRoadMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.8,
        metalness: 0.2,
      });
      const bridgeBeaconMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const bridgePostMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const postGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
      const beaconSphereGeo = new THREE.SphereGeometry(1.8, 8, 8);

      currentLevel.lavaPaths.forEach((p) => {
        if (p.type === 'segment' && p.x1 !== undefined && p.y1 !== undefined && p.x2 !== undefined && p.y2 !== undefined) {
          const dx = p.x2 - p.x1;
          const dy = p.y2 - p.y1;
          const len = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const width = p.width || 110;

          const bridgeGeo = new THREE.BoxGeometry(len, 0.4, width);
          const bridgeMesh = new THREE.Mesh(bridgeGeo, basaltRoadMat);
          bridgeMesh.position.set((p.x1 + p.x2) / 2, 0.2, (p.y1 + p.y2) / 2);
          bridgeMesh.rotation.y = -angle;
          bridgeMesh.receiveShadow = true;
          scene.add(bridgeMesh);

          const count = Math.floor(len / 70);
          for (let i = 0; i <= count; i++) {
            const frac = i / count;
            const px = p.x1 + dx * frac;
            const pz = p.y1 + dy * frac;
            const nx = -Math.sin(angle) * (width / 2 - 4);
            const nz = Math.cos(angle) * (width / 2 - 4);

            [-1, 1].forEach((side) => {
              const post = new THREE.Mesh(postGeo, bridgePostMat);
              post.position.set(px + nx * side, 2.2, pz + nz * side);
              scene.add(post);

              const glow = new THREE.Mesh(beaconSphereGeo, bridgeBeaconMat);
              glow.position.set(px + nx * side, 4.2, pz + nz * side);
              scene.add(glow);
            });
          }
        } else if (p.type === 'island' && p.cx !== undefined && p.cy !== undefined && p.radius !== undefined) {
          const islandGeo = new THREE.CylinderGeometry(p.radius, p.radius, 0.5, 32);
          const islandMesh = new THREE.Mesh(islandGeo, basaltRoadMat);
          islandMesh.position.set(p.cx, 0.25, p.cy);
          islandMesh.receiveShadow = true;
          scene.add(islandMesh);

          const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
          for (let l = 0; l < 12; l++) {
            const ang = (l * Math.PI * 2) / 12;
            const lx = p.cx + Math.cos(ang) * (p.radius - 6);
            const lz = p.cy + Math.sin(ang) * (p.radius - 6);
            const gMesh = new THREE.Mesh(beaconSphereGeo, greenLightMat);
            gMesh.position.set(lx, 2.5, lz);
            scene.add(gMesh);
          }
        }
      });
    }

    // 8. Interactive Mission Targets in 3D
    const targetVisuals: TargetVisualRef[] = [];
    currentLevel.targets.forEach((t) => {
      const targetGroup = new THREE.Group();
      const targetGroundY = getTerrainHeight(
        t.x,
        t.y,
        currentLevel.biome,
        currentLevel.startPos,
        currentLevel.mapWidth,
        currentLevel.mapHeight,
        craters
      );
      targetGroup.position.set(t.x, targetGroundY, t.y);

      const crystals: THREE.Mesh[] = [];

      if (t.type === 'station') {
        const baseGeo = new THREE.CylinderGeometry(28, 32, 14, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.4, metalness: 0.6 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 7;
        baseMesh.castShadow = true;
        targetGroup.add(baseMesh);

        const iconGeo = new THREE.TorusGeometry(8, 1.5, 8, 24);
        const iconMat = new THREE.MeshBasicMaterial({ color: 0x4dd0e1 });
        const iconMesh = new THREE.Mesh(iconGeo, iconMat);
        iconMesh.position.y = 28;
        targetGroup.add(iconMesh);
      } else if (t.type === 'sample') {
        const crystalGeo = new THREE.ConeGeometry(5, 14, 6);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: t.collected ? 0x2ecc71 : 0xf39c12,
          roughness: 0.1,
          metalness: 0.9,
        });
        const c1 = new THREE.Mesh(crystalGeo, crystalMat);
        c1.position.set(0, 7, 0);
        targetGroup.add(c1);
        crystals.push(c1);

        const c2 = new THREE.Mesh(crystalGeo, crystalMat);
        c2.position.set(4, 5, 3);
        c2.rotation.z = 0.3;
        targetGroup.add(c2);
        crystals.push(c2);
      } else if (t.type === 'relay') {
        const towerGeo = new THREE.CylinderGeometry(1.5, 4, 45, 8);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = 22.5;
        targetGroup.add(tower);

        const beaconGeo = new THREE.SphereGeometry(2.5, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 46;
        targetGroup.add(beacon);
      } else if (t.type === 'settlement') {
        const domeGeo = new THREE.SphereGeometry(36, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({
          color: 0x9c27b0,
          roughness: 0.2,
          transparent: true,
          opacity: 0.65,
          wireframe: true,
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0;
        targetGroup.add(dome);
      }

      const ringGeo = new THREE.RingGeometry(34, 37, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: t.collected || t.scanned || t.marked ? 0x2ecc71 : 0xe67e22,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.3;
      targetGroup.add(ring);

      targetVisuals.push({ name: t.name, crystals, ring });
      scene.add(targetGroup);
    });
    targetVisualsRef.current = targetVisuals;

    // 9. Distant Earth in Summit Biome
    if (currentLevel.biome === 'summit') {
      const earthGeo = new THREE.SphereGeometry(30, 16, 16);
      const earthMat = new THREE.MeshBasicMaterial({ color: 0x1e88e5 });
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.position.set(currentLevel.mapWidth * 0.3, 800, currentLevel.mapHeight * 0.2);
      scene.add(earthMesh);

      const starGeo = new THREE.BufferGeometry();
      const starCount = 600;
      const starPositions = new Float32Array(starCount * 3);
      for (let s = 0; s < starCount; s++) {
        starPositions[s * 3] = (Math.random() - 0.5) * 8000;
        starPositions[s * 3 + 1] = 400 + Math.random() * 2000;
        starPositions[s * 3 + 2] = (Math.random() - 0.5) * 8000;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.5 });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);
    }

    // 10. Rover Construction & Addition to Scene
    const {
      group: rGroup,
      wheels,
      solarPanel,
      steerHolders,
      roboticArm,
    } = buildRoverModel(
      skin.color,
      wheel.color,
      wheel.rimColor,
      light.color
    );
    const initialGroundY = getTerrainHeight(
      rover.x,
      rover.y,
      currentLevel.biome,
      currentLevel.startPos,
      currentLevel.mapWidth,
      currentLevel.mapHeight,
      craters
    );
    roverYRef.current = initialGroundY;
    rGroup.position.set(rover.x, initialGroundY, rover.y);
    scene.add(rGroup);

    roverGroupRef.current = rGroup;
    wheelMeshesRef.current = wheels;
    solarPanelMeshRef.current = solarPanel;
    steerHoldersRef.current = steerHolders;
    roboticArmRef.current = roboticArm;

    // Immediately anchor camera directly behind rover to prevent any zoom jump on mount
    const initialChaseDist = 180;
    const initialChaseHeight = 95;
    const initCamX = rover.x - Math.cos(rover.angle) * initialChaseDist;
    const initCamZ = rover.y - Math.sin(rover.angle) * initialChaseDist;
    const initCamY = initialGroundY + initialChaseHeight;
    camera.position.set(initCamX, initCamY, initCamZ);
    camera.lookAt(rover.x, initialGroundY + 14, rover.y);

    // 11. Lava Explosion FX (Shockwave ring & Flash Light)
    const shockGeo = new THREE.RingGeometry(2, 6, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xff5722,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockMesh = new THREE.Mesh(shockGeo, shockMat);
    shockMesh.rotation.x = -Math.PI / 2;
    shockMesh.visible = false;
    scene.add(shockMesh);
    shockwaveMeshRef.current = shockMesh;

    const expLight = new THREE.PointLight(0xff7700, 0, 300);
    scene.add(expLight);
    explosionLightRef.current = expLight;

    // 12. 3D Radar Pulse Ring
    const radarGeo = new THREE.RingGeometry(5, 9, 48);
    const radarMat = new THREE.MeshBasicMaterial({
      color: 0x4dd0e1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const radarRing = new THREE.Mesh(radarGeo, radarMat);
    radarRing.rotation.x = -Math.PI / 2;
    radarRing.visible = false;
    scene.add(radarRing);
    radarRingMeshRef.current = radarRing;

    // 13. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 14. ANIMATION RENDER LOOP (60 FPS)
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const curRover = roverPropsRef.current;
      const inLava = inLavaHazardPropsRef.current;
      const camMode = cameraModePropsRef.current;
      const isDrilling = isDrillingPropsRef.current;
      const drillProg = drillingProgPropsRef.current;

      // Proper Physical Suspension Simulation (Rocker-Bogie Dynamics & Inertia)
      const prevSpd = prevRoverSpeedRef.current;
      const curSpd = curRover.speed;
      const accel = (curSpd - prevSpd) / Math.max(0.001, dt);
      prevRoverSpeedRef.current = curSpd;
      travelDistanceRef.current += Math.abs(curSpd) * dt * 2.5;

      const suspension = calculateRoverSuspension(
        curRover.x,
        curRover.y,
        curRover.angle,
        curSpd,
        accel,
        curRover.steering || 0,
        travelDistanceRef.current,
        currentLevel.biome,
        currentLevel.startPos,
        currentLevel.mapWidth,
        currentLevel.mapHeight,
        levelCratersRef.current
      );

      // Smooth suspension interpolation so chassis reacts organically to terrain contours, bumps & craters
      roverYRef.current = THREE.MathUtils.lerp(
        roverYRef.current,
        suspension.height,
        Math.min(1, dt * 18)
      );
      roverPitchRef.current = THREE.MathUtils.lerp(
        roverPitchRef.current,
        suspension.pitch,
        Math.min(1, dt * 14)
      );
      roverRollRef.current = THREE.MathUtils.lerp(
        roverRollRef.current,
        suspension.roll,
        Math.min(1, dt * 14)
      );

      // Update Rover 3D Transform (Firmly placed on flat ground surface at Y = 0)
      if (roverGroupRef.current) {
        const drillJitter = isDrilling && drillProg > 0.2 && drillProg < 0.85
          ? (Math.random() - 0.5) * 0.25
          : 0;

        // Base elevation is 0.0 + suspension bounce + drill jitter (Never sinks below 0!)
        roverGroupRef.current.position.set(
          curRover.x,
          roverYRef.current + drillJitter,
          curRover.y
        );

        // Tilt chassis with physical pitch (squat/dive) and roll (centrifugal sway) using Euler order 'YXZ'
        roverGroupRef.current.rotation.set(
          roverPitchRef.current,
          -curRover.angle - Math.PI / 2,
          roverRollRef.current,
          'YXZ'
        );

        // Wheel rolling rotation
        wheelMeshesRef.current.forEach((wMesh) => {
          wMesh.rotation.x += curRover.speed * dt * 3.5;
        });

        // Dust tint on solar panel
        if (solarPanelMeshRef.current) {
          const mat = solarPanelMeshRef.current.material as THREE.MeshStandardMaterial;
          const dustNorm = Math.min(1.0, curRover.dust / 100);
          mat.color.setRGB(0.06 + dustNorm * 0.45, 0.09 + dustNorm * 0.15, 0.16);
        }
      }

      // 6-WHEEL ROCKER-BOGIE INDEPENDENT SUSPENSION TRAVEL & 4-CORNER STEERING
      const targetSteerAngle = (curRover.steering || 0) * 0.48; // Responsive steering angle
      steerAngleRef.current += (targetSteerAngle - steerAngleRef.current) * Math.min(1, dt * 14);

      const holders = steerHoldersRef.current;
      const baseWheelRadius = 6.5;

      if (holders.FL) {
        holders.FL.rotation.y = steerAngleRef.current;
        holders.FL.position.y = baseWheelRadius + suspension.wheelOffsets.FL;
      }
      if (holders.FR) {
        holders.FR.rotation.y = steerAngleRef.current;
        holders.FR.position.y = baseWheelRadius + suspension.wheelOffsets.FR;
      }
      if (holders.ML) {
        holders.ML.position.y = baseWheelRadius + suspension.wheelOffsets.ML;
      }
      if (holders.MR) {
        holders.MR.position.y = baseWheelRadius + suspension.wheelOffsets.MR;
      }
      if (holders.RL) {
        holders.RL.rotation.y = -steerAngleRef.current;
        holders.RL.position.y = baseWheelRadius + suspension.wheelOffsets.RL;
      }
      if (holders.RR) {
        holders.RR.rotation.y = -steerAngleRef.current;
        holders.RR.position.y = baseWheelRadius + suspension.wheelOffsets.RR;
      }

      // Dynamic Headlights System (Toggleable via H key or HUD)
      const isHeadlightsOn = curRover.headlightsOn !== false;
      const targetIntensity = isHeadlightsOn ? 8.5 : 0;
      if (headlightSpot1Ref.current) headlightSpot1Ref.current.intensity = targetIntensity;
      if (headlightSpot2Ref.current) headlightSpot2Ref.current.intensity = targetIntensity;
      headlightBeamsRef.current.forEach((beam) => {
        beam.visible = isHeadlightsOn;
      });
      headlightBulbsRef.current.forEach((bulb) => {
        (bulb.material as THREE.MeshBasicMaterial).color.set(
          isHeadlightsOn ? light.color : '#222222'
        );
      });

      // ARTICULATED ROBOTIC ARM DRILLING ANIMATION (1 SECOND FULL CYCLE)
      const arm = roboticArmRef.current;
      if (arm.shoulder && arm.elbow && arm.wrist && arm.drillBit && arm.chuck) {
        if (isDrilling) {
          if (drillProg < 0.22) {
            // Phase 1: Deploy arm to ground
            const t = drillProg / 0.22;
            arm.shoulder.rotation.x = THREE.MathUtils.lerp(-0.4, 0.95, t);
            arm.shoulder.rotation.z = THREE.MathUtils.lerp(0.2, 0.0, t);
            arm.elbow.rotation.x = THREE.MathUtils.lerp(2.4, 1.1, t);
            arm.wrist.rotation.x = THREE.MathUtils.lerp(-1.2, 1.1, t);
          } else if (drillProg < 0.85) {
            // Phase 2: Active rotary coring & percussive drilling
            arm.shoulder.rotation.x = 0.95 + Math.sin(time * 0.09) * 0.02;
            arm.shoulder.rotation.z = 0.0;
            arm.elbow.rotation.x = 1.1 + Math.cos(time * 0.09) * 0.02;
            arm.wrist.rotation.x = 1.1;

            // High-speed drill bit spin
            arm.drillBit.rotation.y += 85 * dt;

            // Percussive hammer vibration on drill chuck
            arm.chuck.position.y = 2.5 + Math.sin(time * 0.12) * 0.35;

            // Spawn drill sparks and rock dust particles at drill contact point
            const bitWorldPos = new THREE.Vector3();
            arm.drillBit.getWorldPosition(bitWorldPos);

            for (let s = 0; s < 2; s++) {
              const sparkGeo = new THREE.SphereGeometry(0.55 + Math.random() * 0.4, 4, 4);
              const sparkMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.4 ? 0xffea00 : 0xff5722,
              });
              const spark = new THREE.Mesh(sparkGeo, sparkMat);
              spark.position.set(
                bitWorldPos.x + (Math.random() - 0.5) * 2,
                0.3,
                bitWorldPos.z + (Math.random() - 0.5) * 2
              );
              scene.add(spark);

              const ang = Math.random() * Math.PI * 2;
              const spd = 6 + Math.random() * 16;
              drillSparksRef.current.push({
                mesh: spark,
                vx: Math.cos(ang) * spd,
                vy: 10 + Math.random() * 18,
                vz: Math.sin(ang) * spd,
                life: 0,
                maxLife: 0.35 + Math.random() * 0.25,
              });
            }
          } else {
            // Phase 3: Retract back to stowed deck position
            const t = (drillProg - 0.85) / 0.15;
            arm.shoulder.rotation.x = THREE.MathUtils.lerp(0.95, -0.4, t);
            arm.shoulder.rotation.z = THREE.MathUtils.lerp(0.0, 0.2, t);
            arm.elbow.rotation.x = THREE.MathUtils.lerp(1.1, 2.4, t);
            arm.wrist.rotation.x = THREE.MathUtils.lerp(1.1, -1.2, t);
          }
        } else {
          // Stowed resting position
          arm.shoulder.rotation.x = -0.4;
          arm.shoulder.rotation.z = 0.2;
          arm.elbow.rotation.x = 2.4;
          arm.wrist.rotation.x = -1.2;
          arm.chuck.position.y = 2.5;
        }
      }

      // Update Drill Spark Particles
      for (let i = drillSparksRef.current.length - 1; i >= 0; i--) {
        const spk = drillSparksRef.current[i];
        spk.life += dt;
        spk.mesh.position.x += spk.vx * dt;
        spk.mesh.position.y += spk.vy * dt;
        spk.mesh.position.z += spk.vz * dt;
        spk.vy -= 45 * dt;

        const prog = spk.life / spk.maxLife;
        spk.mesh.scale.setScalar(Math.max(0.01, 1 - prog));

        if (spk.life >= spk.maxLife) {
          scene.remove(spk.mesh);
          spk.mesh.geometry.dispose();
          drillSparksRef.current.splice(i, 1);
        }
      }

      // Wheel Dust Particles
      if (Math.abs(curRover.speed) > 0.4 && trail.id !== 'none') {
        const trailMat = new THREE.MeshBasicMaterial({
          color: trail.id === 'cyber' ? 0x00e5ff : 0xd35400,
          transparent: true,
          opacity: 0.6,
        });
        const puffGeo = new THREE.SphereGeometry(1.2 + Math.random() * 1.5, 6, 6);
        const puff = new THREE.Mesh(puffGeo, trailMat);

        const rearDist = 18;
        puff.position.set(
          curRover.x - Math.cos(curRover.angle) * rearDist + (Math.random() - 0.5) * 6,
          1.5 + Math.random() * 2,
          curRover.y - Math.sin(curRover.angle) * rearDist + (Math.random() - 0.5) * 6
        );
        scene.add(puff);
        wheelTrailsRef.current.push({ mesh: puff, life: 0, maxLife: 0.65 });
      }

      // Update Wheel Trail Particles
      for (let i = wheelTrailsRef.current.length - 1; i >= 0; i--) {
        const p = wheelTrailsRef.current[i];
        p.life += dt;
        p.mesh.position.y += dt * 4;
        p.mesh.scale.multiplyScalar(1.02);
        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.6 * (1 - p.life / p.maxLife));

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          wheelTrailsRef.current.splice(i, 1);
        }
      }

      // Continuous lava sizzle & bubbling sparks when inside lava hazard
      if (inLava && time - lastLavaSizzleTimeRef.current > 180) {
        lastLavaSizzleTimeRef.current = time;
        const sparkGeo = new THREE.SphereGeometry(1.0, 6, 6);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffab00 });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.set(
          curRover.x + (Math.random() - 0.5) * 20,
          0.8,
          curRover.y + (Math.random() - 0.5) * 20
        );
        scene.add(spark);

        lavaParticlesRef.current.push({
          mesh: spark,
          vx: (Math.random() - 0.5) * 25,
          vy: 18 + Math.random() * 20,
          vz: (Math.random() - 0.5) * 25,
          life: 0,
          maxLife: 0.6,
          rotSpeed: 5,
        });
      }

      // Update Ballistic Lava Explosion Particles
      for (let i = lavaParticlesRef.current.length - 1; i >= 0; i--) {
        const p = lavaParticlesRef.current[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 75 * dt;

        p.mesh.rotation.x += p.rotSpeed * dt;
        p.mesh.rotation.y += p.rotSpeed * dt;

        if (p.mesh.position.y < 0.2) {
          p.mesh.position.y = 0.2;
          p.vy = -p.vy * 0.35;
          p.vx *= 0.6;
          p.vz *= 0.6;
        }

        const prog = p.life / p.maxLife;
        p.mesh.scale.setScalar(Math.max(0.01, 1 - prog * 0.8));

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          lavaParticlesRef.current.splice(i, 1);
        }
      }

      // Update Rising Volcanic Smoke Particles
      for (let i = smokeParticlesRef.current.length - 1; i >= 0; i--) {
        const s = smokeParticlesRef.current[i];
        s.life += dt;
        s.mesh.position.x += s.vx * dt;
        s.mesh.position.y += s.vy * dt;
        s.mesh.position.z += s.vz * dt;
        s.mesh.scale.multiplyScalar(s.scaleGrowth);

        const prog = s.life / s.maxLife;
        const mat = s.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(0, 0.75 * (1 - prog));

        if (s.life >= s.maxLife) {
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          smokeParticlesRef.current.splice(i, 1);
        }
      }

      // Update Shockwave Ring
      if (shockwaveMeshRef.current && shockwaveMeshRef.current.visible) {
        shockwaveMeshRef.current.scale.multiplyScalar(1.08 + dt * 2.5);
        const mat = shockwaveMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity -= dt * 1.8;
        if (mat.opacity <= 0) {
          shockwaveMeshRef.current.visible = false;
        }
      }

      // Update Explosion Light Flash Decay
      if (explosionLightRef.current && explosionLightRef.current.intensity > 0) {
        explosionLightRef.current.intensity = Math.max(0, explosionLightRef.current.intensity - dt * 60);
      }

      // Update 3D Radar Pulse Ring
      if (radarRingMeshRef.current && radarRingMeshRef.current.visible) {
        radarRingMeshRef.current.scale.multiplyScalar(1.06 + dt * 3.5);
        const mat = radarRingMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity -= dt * 1.4;
        if (mat.opacity <= 0) {
          radarRingMeshRef.current.visible = false;
        }
      }

      // Camera Shake Trauma Decay
      if (cameraTraumaRef.current > 0) {
        cameraTraumaRef.current = Math.max(0, cameraTraumaRef.current - dt * 2.2);
      }
      const shakeAmount = cameraTraumaRef.current * cameraTraumaRef.current;
      const shakeX = (Math.random() - 0.5) * shakeAmount * 16;
      const shakeY = (Math.random() - 0.5) * shakeAmount * 16;
      const shakeZ = (Math.random() - 0.5) * shakeAmount * 16;

      // CAMERA POSITIONING MODES: CHASE, TOP-DOWN, COCKPIT
      const roverElev = roverYRef.current;

      if (camMode === 'topdown') {
        camera.up.set(0, 0, -1);
        const topDownHeight = 440;
        camera.position.set(curRover.x + shakeX, roverElev + topDownHeight + shakeY, curRover.y + shakeZ);
        camera.lookAt(curRover.x, roverElev, curRover.y);
      } else if (camMode === 'cockpit') {
        camera.up.set(0, 1, 0);
        const mastX = curRover.x + Math.cos(curRover.angle) * 8 + shakeX;
        const mastZ = curRover.y + Math.sin(curRover.angle) * 8 + shakeZ;
        camera.position.set(mastX, roverElev + 32 + shakeY, mastZ);
        camera.lookAt(
          curRover.x + Math.cos(curRover.angle) * 220,
          roverElev + 18,
          curRover.y + Math.sin(curRover.angle) * 220
        );
      } else {
        camera.up.set(0, 1, 0);
        const chaseDist = 180;
        const chaseHeight = 95;
        const targetCamX = curRover.x - Math.cos(curRover.angle) * chaseDist + shakeX;
        const targetCamZ = curRover.y - Math.sin(curRover.angle) * chaseDist + shakeZ;
        const camTerrainY = getTerrainHeight(
          targetCamX,
          targetCamZ,
          currentLevel.biome,
          currentLevel.startPos,
          currentLevel.mapWidth,
          currentLevel.mapHeight,
          levelCratersRef.current
        );
        const targetCamY = Math.max(roverElev + chaseHeight, camTerrainY + 28) + shakeY;

        camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
        camera.lookAt(curRover.x, roverElev + 14, curRover.y);
      }

      // Render Scene
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      groundTexture.dispose();
      horizonTexture.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      horizonGeo.dispose();
      horizonMat.dispose();
      renderer.dispose();
    };
  }, [currentLevel.title, currentLevel.biome, skin.id, wheel.id, light.id, trail.id]);

  // Dynamically update target markers/crystals without rebuilding the 3D world or resetting camera
  useEffect(() => {
    targetVisualsRef.current.forEach((item) => {
      const live = currentLevel.targets.find((t) => t.name === item.name);
      if (live) {
        item.crystals.forEach((c) => {
          (c.material as THREE.MeshStandardMaterial).color.set(
            live.collected ? 0x2ecc71 : 0xf39c12
          );
        });
        (item.ring.material as THREE.MeshBasicMaterial).color.set(
          live.collected || live.scanned || live.marked ? 0x2ecc71 : 0xe67e22
        );
      }
    });
  }, [currentLevel.targets]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      {/* Three.js WebGL Canvas */}
      <canvas ref={canvasRef} id="gameCanvas" className="absolute inset-0 z-0 block w-full h-full" />

      {/* THERMAL SHOCK OVERLAY FLASH WHEN IN LAVA */}
      {inLavaHazard && (
        <div className="absolute inset-0 z-10 pointer-events-none border-4 border-red-600/80 bg-gradient-to-t from-red-600/30 via-transparent to-orange-500/20 animate-pulse flex items-end justify-center pb-24">
          <div className="bg-red-950/90 border border-red-500 text-red-200 px-4 py-1.5 rounded-xl font-orbitron font-black text-xs tracking-widest flex items-center space-x-2 shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>CRITICAL THERMAL SHOCK • RETREAT TO BASALT BRIDGE!</span>
          </div>
        </div>
      )}
    </div>
  );
};
