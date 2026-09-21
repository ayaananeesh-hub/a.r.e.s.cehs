import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Camera,
  Layers,
  Sparkles,
  Gauge,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SoundType } from '../hooks/useSoundEffects';

interface Cinematic3DIntroProps {
  isOpen: boolean;
  onFinish: () => void;
  onOpenStoryBriefing?: () => void;
  playSound?: (type: SoundType) => void;
  speakText?: (text: string) => void;
  audioEnabled?: boolean;
}

type CameraMode = 'director' | 'orbit' | 'rover' | 'chase';

interface TelemetryData {
  altitude: number; // meters
  velocity: number; // m/s
  acceleration: number; // m/s^2
  mach: number;
  dynamicPressure: number; // kPa
  atmosphereDensity: number; // kg/m^3
  thrusterThrottle: number; // %
  phaseName: string;
  subtitles: string;
}

export const Cinematic3DIntro: React.FC<Cinematic3DIntroProps> = ({
  isOpen,
  onFinish,
  onOpenStoryBriefing,
  playSound,
  speakText,
  audioEnabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('director');
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!audioEnabled);

  // Flight Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    altitude: 125000,
    velocity: 5400,
    acceleration: -3.72,
    mach: 22.4,
    dynamicPressure: 0.1,
    atmosphereDensity: 0.0001,
    thrusterThrottle: 0,
    phaseName: 'PHASE 1: ATMOSPHERIC ENTRY INTERFACE',
    subtitles: 'Houston, Odyssey Flight Director. Ares Explorer has entered Mars upper atmosphere at Mach 22.',
  });

  const TOTAL_DURATION = 60; // 60 seconds full cinematic sequence

  // Refs for animation & Three.js objects
  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(true);
  const speedRef = useRef<number>(1.0);
  const lastSoundPhaseRef = useRef<number>(-1);
  const cameraModeRef = useRef<CameraMode>('director');

  // Orbit drag controls refs
  const isDraggingRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitAnglesRef = useRef<{ theta: number; phi: number; dist: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 5,
    dist: 35,
  });

  isPlayingRef.current = isPlaying;
  speedRef.current = playbackSpeed;
  cameraModeRef.current = cameraMode;

  // Speak voice telemetry when subtitles change
  const lastSpokenSubRef = useRef<string>('');
  const triggerVoice = useCallback(
    (text: string) => {
      if (speakText && !isAudioMuted && text !== lastSpokenSubRef.current) {
        lastSpokenSubRef.current = text;
        speakText(text);
      }
    },
    [speakText, isAudioMuted]
  );

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040711');
    scene.fog = new THREE.FogExp2('#1A0A06', 0.0018);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 30, 70);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight('#2B1510', 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFE0B2', 2.2);
    sunLight.position.set(80, 120, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // Rim light from Martian reddish atmosphere
    const rimLight = new THREE.DirectionalLight('#E65100', 1.2);
    rimLight.position.set(-60, 20, -50);
    scene.add(rimLight);

    // Dynamic thruster point lights
    const thrusterLight1 = new THREE.PointLight('#FF5722', 0, 45);
    const thrusterLight2 = new THREE.PointLight('#00E5FF', 0, 45);
    scene.add(thrusterLight1);
    scene.add(thrusterLight2);

    // --- STARFIELD ---
    const starsCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 700 + Math.random() * 200;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = Math.abs(r * Math.cos(phi)) + 50;
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- PROCEDURAL 3D MARTIAN TERRAIN ---
    const terrainSize = 500;
    const terrainSegments = 100;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Distance from landing center (0, 0)
      const dist = Math.hypot(vx, vz);

      // Flatter landing zone in center, rocky dunes further out
      let heightVal =
        Math.sin(vx * 0.03) * Math.cos(vz * 0.03) * 3.5 +
        Math.sin(vx * 0.08 + vz * 0.05) * 1.5 +
        Math.cos(vx * 0.015) * 4.0;

      // Crater feature at (70, 60)
      const cDist = Math.hypot(vx - 70, vz - 60);
      if (cDist < 45) {
        heightVal -= (45 - cDist) * 0.25;
      }

      // Smooth central landing zone
      if (dist < 30) {
        heightVal *= dist / 30;
      }

      pos.setY(i, heightVal);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: '#B23A16',
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Landing Bullseye rings at center
    const ringGeo = new THREE.RingGeometry(6, 6.6, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#4DD0E1',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const landingRing = new THREE.Mesh(ringGeo, ringMat);
    landingRing.position.set(0, 0.25, 0);
    scene.add(landingRing);

    const innerRingGeo = new THREE.RingGeometry(2.5, 3.0, 48);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: '#2ECC71',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const landingInnerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    landingInnerRing.position.set(0, 0.28, 0);
    scene.add(landingInnerRing);

    // Scattered boulders around terrain
    const rocksGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: '#5C2210', roughness: 0.9 });
    for (let r = 0; r < 55; r++) {
      const rx = (Math.random() - 0.5) * 220;
      const rz = (Math.random() - 0.5) * 220;
      if (Math.hypot(rx, rz) < 14) continue; // Keep landing target clear

      const rGeo = new THREE.DodecahedronGeometry(Math.random() * 1.6 + 0.5, 1);
      const rockMesh = new THREE.Mesh(rGeo, rockMat);
      rockMesh.position.set(rx, 0.5, rz);
      rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      rocksGroup.add(rockMesh);
    }
    scene.add(rocksGroup);

    // --- VEHICLE HIERARCHY ---
    // Vehicle root follows physics-driven (x, y, z)
    const spacecraftGroup = new THREE.Group();
    scene.add(spacecraftGroup);

    // 1. AEROSHELL & HEAT SHIELD (Phase 1 & 2)
    const aeroshellGroup = new THREE.Group();
    spacecraftGroup.add(aeroshellGroup);

    // Conical Backshell
    const backshellGeo = new THREE.ConeGeometry(4.2, 3.8, 24, 1, true);
    const backshellMat = new THREE.MeshStandardMaterial({
      color: '#E0E0E0',
      roughness: 0.35,
      metalness: 0.8,
    });
    const backshell = new THREE.Mesh(backshellGeo, backshellMat);
    backshell.position.y = 1.9;
    aeroshellGroup.add(backshell);

    // Ablative Heat Shield at the bottom
    const heatShieldGeo = new THREE.CylinderGeometry(4.3, 3.8, 0.8, 24);
    const heatShieldMat = new THREE.MeshStandardMaterial({
      color: '#331B12',
      roughness: 0.6,
      emissive: '#FF3D00',
      emissiveIntensity: 0.0,
    });
    const heatShield = new THREE.Mesh(heatShieldGeo, heatShieldMat);
    heatShield.position.y = -0.3;
    aeroshellGroup.add(heatShield);

    // Re-entry Plasma Aura Halo
    const plasmaGeo = new THREE.RingGeometry(3.5, 6.2, 32);
    plasmaGeo.rotateX(-Math.PI / 2);
    const plasmaMat = new THREE.MeshBasicMaterial({
      color: '#FF6D00',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const plasmaRing = new THREE.Mesh(plasmaGeo, plasmaMat);
    plasmaRing.position.y = -0.5;
    aeroshellGroup.add(plasmaRing);

    // 2. SUPERSONIC PARACHUTE (Phase 2)
    const parachuteGroup = new THREE.Group();
    parachuteGroup.visible = false;
    spacecraftGroup.add(parachuteGroup);

    // Canopy (half-sphere hemisphere)
    const canopyGeo = new THREE.SphereGeometry(9, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: '#FF5722',
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 28;
    canopy.rotation.x = Math.PI;
    parachuteGroup.add(canopy);

    // White stripes on parachute
    const stripeGeo = new THREE.SphereGeometry(9.05, 24, 8, 0, Math.PI * 0.4, 0, Math.PI * 0.45);
    const stripeMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });
    const stripeMesh1 = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh1.position.y = 28;
    stripeMesh1.rotation.x = Math.PI;
    parachuteGroup.add(stripeMesh1);

    // Parachute Cords
    const cordMat = new THREE.LineBasicMaterial({ color: '#CCCCCC', transparent: true, opacity: 0.7 });
    const cordPoints: THREE.Vector3[] = [];
    const numCords = 12;
    for (let c = 0; c < numCords; c++) {
      const ang = (c * Math.PI * 2) / numCords;
      const topX = Math.cos(ang) * 8.5;
      const topZ = Math.sin(ang) * 8.5;
      cordPoints.push(new THREE.Vector3(0, 3.8, 0), new THREE.Vector3(topX, 26, topZ));
    }
    const cordGeo = new THREE.BufferGeometry().setFromPoints(cordPoints);
    const parachuteCords = new THREE.LineSegments(cordGeo, cordMat);
    parachuteGroup.add(parachuteCords);

    // 3. SKY-CRANE DESCENT STAGE (Phase 3 & 4)
    const skyCraneGroup = new THREE.Group();
    skyCraneGroup.visible = false;
    spacecraftGroup.add(skyCraneGroup);

    // Main octagonal truss framework
    const craneFrameGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.9, 8);
    const craneFrameMat = new THREE.MeshStandardMaterial({
      color: '#455A64',
      metalness: 0.7,
      roughness: 0.3,
    });
    const craneFrame = new THREE.Mesh(craneFrameGeo, craneFrameMat);
    craneFrame.position.y = 0;
    craneFrame.castShadow = true;
    skyCraneGroup.add(craneFrame);

    // Hydrazine Propellant Tanks (4 metallic spheres)
    const tankGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const tankMat = new THREE.MeshStandardMaterial({
      color: '#CFD8DC',
      metalness: 0.9,
      roughness: 0.2,
    });
    for (let tk = 0; tk < 4; tk++) {
      const tAng = (tk * Math.PI) / 2 + Math.PI / 4;
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(Math.cos(tAng) * 1.9, 0.4, Math.sin(tAng) * 1.9);
      skyCraneGroup.add(tank);
    }

    // 8 Rocket Thruster Nozzles + Flame Cones
    const thrusterCones: THREE.Mesh[] = [];
    const nozzleMat = new THREE.MeshStandardMaterial({ color: '#263238', metalness: 0.8 });
    const flameMat = new THREE.MeshBasicMaterial({
      color: '#FF7043',
      transparent: true,
      opacity: 0.85,
    });

    for (let th = 0; th < 4; th++) {
      const thAng = (th * Math.PI) / 2;
      const thDist = 2.5;

      const nozzleGeo = new THREE.CylinderGeometry(0.18, 0.35, 0.6, 12);
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle.position.set(Math.cos(thAng) * thDist, -0.45, Math.sin(thAng) * thDist);
      nozzle.rotation.z = Math.cos(thAng) * 0.15;
      nozzle.rotation.x = -Math.sin(thAng) * 0.15;
      skyCraneGroup.add(nozzle);

      // Flame plume cone
      const flameGeo = new THREE.ConeGeometry(0.4, 2.4, 12);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(Math.cos(thAng) * thDist, -1.8, Math.sin(thAng) * thDist);
      flame.rotation.x = Math.PI;
      skyCraneGroup.add(flame);
      thrusterCones.push(flame);
    }

    // 3 Bridle Umbilical Cables to Rover (Phase 4)
    const bridleLineMat = new THREE.LineBasicMaterial({ color: '#FFD54F', linewidth: 2 });
    const bridleGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -7, 0),
      new THREE.Vector3(1.2, 0, 1.2),
      new THREE.Vector3(0.8, -7, 0.8),
      new THREE.Vector3(-1.2, 0, 1.2),
      new THREE.Vector3(-0.8, -7, 0.8),
      new THREE.Vector3(0, 0, -1.5),
      new THREE.Vector3(0, -7, -1.0),
    ]);
    const bridleCables = new THREE.LineSegments(bridleGeo, bridleLineMat);
    skyCraneGroup.add(bridleCables);

    // 4. ARES EXPLORER ROVER 3D MODEL
    const roverGroup = new THREE.Group();
    spacecraftGroup.add(roverGroup);

    // Main Chassis Body
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.1, 3.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#ECEFF1',
      metalness: 0.6,
      roughness: 0.35,
    });
    const roverBody = new THREE.Mesh(bodyGeo, bodyMat);
    roverBody.position.y = 1.3;
    roverBody.castShadow = true;
    roverGroup.add(roverBody);

    // Gold Foil MLI blanket on chassis sides
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#FFB300',
      metalness: 0.9,
      roughness: 0.25,
    });
    const foilGeo = new THREE.BoxGeometry(2.44, 0.8, 3.2);
    const foil = new THREE.Mesh(foilGeo, goldMat);
    foil.position.y = 1.3;
    roverGroup.add(foil);

    // Remote Sensing Mast & Camera Head
    const mastBaseGroup = new THREE.Group();
    mastBaseGroup.position.set(0.6, 1.9, -1.1);
    roverGroup.add(mastBaseGroup);

    const mastPoleGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.8, 12);
    const mastPoleMat = new THREE.MeshStandardMaterial({ color: '#37474F', metalness: 0.7 });
    const mastPole = new THREE.Mesh(mastPoleGeo, mastPoleMat);
    mastPole.position.y = 0.9;
    mastPole.castShadow = true;
    mastBaseGroup.add(mastPole);

    const camHeadGeo = new THREE.BoxGeometry(0.5, 0.3, 0.4);
    const camHeadMat = new THREE.MeshStandardMaterial({ color: '#263238' });
    const camHead = new THREE.Mesh(camHeadGeo, camHeadMat);
    camHead.position.y = 1.8;
    mastBaseGroup.add(camHead);

    // Camera lenses (stereo eyes)
    const lensGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.15, 12);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({ color: '#00E5FF' });
    const lensL = new THREE.Mesh(lensGeo, lensMat);
    lensL.position.set(-0.14, 1.8, 0.22);
    const lensR = new THREE.Mesh(lensGeo, lensMat);
    lensR.position.set(0.14, 1.8, 0.22);
    mastBaseGroup.add(lensL);
    mastBaseGroup.add(lensR);

    // High Gain Dish Antenna
    const dishGroup = new THREE.Group();
    dishGroup.position.set(-0.7, 1.9, 1.0);
    roverGroup.add(dishGroup);

    const dishGeo = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const dishMat = new THREE.MeshStandardMaterial({ color: '#ECEFF1', metalness: 0.8, side: THREE.DoubleSide });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = -Math.PI / 3;
    dishGroup.add(dish);

    // Dual Unfolding Solar Arrays
    const solarWingLeft = new THREE.Group();
    solarWingLeft.position.set(1.2, 1.85, 0);
    roverGroup.add(solarWingLeft);

    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: '#0D47A1',
      metalness: 0.8,
      roughness: 0.15,
      emissive: '#0D47A1',
      emissiveIntensity: 0.1,
    });
    const panelGeo = new THREE.BoxGeometry(1.6, 0.05, 2.8);
    const panelL = new THREE.Mesh(panelGeo, solarPanelMat);
    panelL.position.x = 0.8;
    panelL.castShadow = true;
    solarWingLeft.add(panelL);

    const solarWingRight = new THREE.Group();
    solarWingRight.position.set(-1.2, 1.85, 0);
    roverGroup.add(solarWingRight);

    const panelR = new THREE.Mesh(panelGeo, solarPanelMat);
    panelR.position.x = -0.8;
    panelR.castShadow = true;
    solarWingRight.add(panelR);

    // Start solar panels folded
    solarWingLeft.rotation.z = -Math.PI * 0.48;
    solarWingRight.rotation.z = Math.PI * 0.48;

    // Rocker-Bogie Suspension & 6 Knurled Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelMat = new THREE.MeshStandardMaterial({
      color: '#37474F',
      roughness: 0.6,
      metalness: 0.5,
    });

    const wheelPositions = [
      { x: 1.6, y: 0.5, z: 1.4 },
      { x: 1.7, y: 0.5, z: 0 },
      { x: 1.6, y: 0.5, z: -1.4 },
      { x: -1.6, y: 0.5, z: 1.4 },
      { x: -1.7, y: 0.5, z: 0 },
      { x: -1.6, y: 0.5, z: -1.4 },
    ];

    wheelPositions.forEach((wp) => {
      const wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 20);
      wGeo.rotateZ(Math.PI / 2);
      const wheel = new THREE.Mesh(wGeo, wheelMat);
      wheel.position.set(wp.x, wp.y, wp.z);
      wheel.castShadow = true;
      roverGroup.add(wheel);
      wheels.push(wheel);

      // Suspension Arm linking to chassis
      const armPoints = [new THREE.Vector3(wp.x * 0.6, 1.1, wp.z * 0.7), new THREE.Vector3(wp.x, wp.y, wp.z)];
      const armGeo = new THREE.BufferGeometry().setFromPoints(armPoints);
      const armLine = new THREE.Line(armGeo, new THREE.LineBasicMaterial({ color: '#263238', linewidth: 3 }));
      roverGroup.add(armLine);
    });

    // Rover Headlight Beams
    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0, 20);
    scene.add(headlightTarget);

    const roverSpotlight = new THREE.SpotLight('#E0F7FA', 0, 50, Math.PI / 6, 0.5, 1);
    roverSpotlight.position.set(0, 1.6, 1.8);
    roverSpotlight.target = headlightTarget;
    roverGroup.add(roverSpotlight);

    // Dust Cloud Particles on Touchdown
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustVel: THREE.Vector3[] = [];
    for (let d = 0; d < dustCount; d++) {
      dustPos[d * 3] = 0;
      dustPos[d * 3 + 1] = 0.2;
      dustPos[d * 3 + 2] = 0;
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 2;
      dustVel.push(new THREE.Vector3(Math.cos(angle) * spd, Math.random() * 2 + 0.5, Math.sin(angle) * spd));
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: '#D84315',
      size: 2.2,
      transparent: true,
      opacity: 0,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // --- ORBIT DRAG CONTROLS ---
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mousePosRef.current = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - mousePosRef.current.x;
      const dy = clientY - mousePosRef.current.y;
      mousePosRef.current = { x: clientX, y: clientY };

      orbitAnglesRef.current.theta -= dx * 0.008;
      orbitAnglesRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitAnglesRef.current.phi + dy * 0.008));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      orbitAnglesRef.current.dist = Math.max(8, Math.min(120, orbitAnglesRef.current.dist + e.deltaY * 0.05));
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown);
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: true });

    // Window Resize Handler
    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // --- ANIMATION & PHYSICS LOOP ---
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlayingRef.current) {
        timeRef.current += deltaSec * speedRef.current;
        if (timeRef.current > TOTAL_DURATION) {
          timeRef.current = TOTAL_DURATION;
          setIsPlaying(false);
        }
        setPlaybackTime(timeRef.current);
      }

      const t = timeRef.current;

      // -------------------------------------------------------------
      // 5-PHASE EDL GRAVITY & PHYSICS SIMULATION
      // -------------------------------------------------------------

      let currentAlt = 125000;
      let currentVel = 5400;
      let currentAccel = -3.72;
      let machNum = 22.4;
      let dynPress = 0.1;
      let atmoDensity = 0.0001;
      let throttlePct = 0;
      let phaseTitle = '';
      let dispatchVoice = '';

      // Animate dust particles
      const dustAttr = dustGeo.attributes.position as THREE.BufferAttribute;

      if (t < 14) {
        // ==========================================
        // PHASE 1: ATMOSPHERIC ENTRY (0s - 14s)
        // ==========================================
        const progress = t / 14;
        phaseTitle = 'PHASE 1: ATMOSPHERIC ENTRY (MACH 22 → MACH 2)';
        dispatchVoice =
          'Atmospheric entry interface confirmed. Aerothermal plasma sheath active. Peak deceleration at 11 G.';

        // Altitude from 125 km down to 11.2 km
        currentAlt = Math.max(11200, 125000 * Math.exp(-progress * 2.4));
        currentVel = 5400 - progress * 4980; // 5400 m/s down to 420 m/s
        machNum = currentVel / 240; // Speed of sound on Mars ~ 240 m/s
        atmoDensity = 0.0001 + Math.pow(progress, 3) * 0.018;
        dynPress = 0.5 * atmoDensity * Math.pow(currentVel, 2) * 0.001;
        currentAccel = -3.72 - (dynPress * 12) / 100;

        // Visuals
        aeroshellGroup.visible = true;
        parachuteGroup.visible = false;
        skyCraneGroup.visible = false;
        roverGroup.visible = false;

        // Visual 3D position & descent
        spacecraftGroup.position.set(
          Math.sin(t * 0.2) * 2,
          75 - progress * 45 + (Math.random() - 0.5) * 0.15, // re-entry shudder
          -100 + progress * 80
        );
        spacecraftGroup.rotation.set(-0.2 + Math.sin(t * 1.5) * 0.05, t * 0.4, 0.1);

        // Heat shield plasma glow
        const heatPulse = 0.5 + 0.5 * Math.sin(t * 8);
        (heatShield.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + heatPulse * 0.8;
        plasmaMat.opacity = Math.min(0.9, progress * 1.5);
        plasmaRing.rotation.z += 0.1;

        if (lastSoundPhaseRef.current !== 1) {
          lastSoundPhaseRef.current = 1;
          playSound?.('whoosh');
        }

        // Camera Director: Dynamic chase camera behind blazing heat shield
        if (cameraModeRef.current === 'director') {
          camera.position.set(
            spacecraftGroup.position.x + 12,
            spacecraftGroup.position.y + 6,
            spacecraftGroup.position.z + 28
          );
          camera.lookAt(spacecraftGroup.position);
        }
      } else if (t < 28) {
        // ==========================================
        // PHASE 2: SUPERSONIC PARACHUTE & HEAT SHIELD JETTISON (14s - 28s)
        // ==========================================
        const progress = (t - 14) / 14;
        phaseTitle = 'PHASE 2: SUPERSONIC PARACHUTE DEPLOY & HEAT SHIELD JETTISON';
        dispatchVoice =
          'Parachute mortar fired! Mach 2.2 supersonic inflation. Heat shield separated. Gravity: 3.721 m/s².';

        // Altitude 11.2 km down to 2.1 km
        currentAlt = 11200 - progress * 9100;
        currentVel = 420 - progress * 340; // 420 down to 80 m/s
        machNum = currentVel / 240;
        atmoDensity = 0.015 + progress * 0.005;
        dynPress = 0.5 * atmoDensity * Math.pow(currentVel, 2) * 0.001;
        currentAccel = -3.72 + (currentVel > 90 ? -8.5 * (1 - progress) : 0);

        aeroshellGroup.visible = true;
        parachuteGroup.visible = true;
        skyCraneGroup.visible = false;
        roverGroup.visible = false;
        plasmaMat.opacity = 0;

        // Position: slowing down descent
        spacecraftGroup.position.set(Math.sin(t * 0.4) * 1.5, 30 - progress * 12, -20 + progress * 15);
        spacecraftGroup.rotation.set(Math.sin(t * 2) * 0.08, 0, Math.cos(t * 1.8) * 0.08);

        // Parachute billowing flutter
        canopy.rotation.z = Math.sin(t * 6) * 0.08;

        // Heat shield detaches and falls freely under Mars gravity (a = g = 3.72 m/s²)
        heatShield.position.y = -0.3 - progress * progress * 65;
        heatShield.rotation.x += 0.05;
        heatShield.rotation.y += 0.08;

        if (lastSoundPhaseRef.current !== 2) {
          lastSoundPhaseRef.current = 2;
          playSound?.('boom');
        }

        // Camera Director: Low-angle looking upward at the giant chute and falling shield
        if (cameraModeRef.current === 'director') {
          camera.position.set(spacecraftGroup.position.x - 8, spacecraftGroup.position.y - 12, spacecraftGroup.position.z + 24);
          camera.lookAt(spacecraftGroup.position.x, spacecraftGroup.position.y + 12, spacecraftGroup.position.z);
        }
      } else if (t < 42) {
        // ==========================================
        // PHASE 3: SKY-CRANE POWERED DESCENT (28s - 42s)
        // ==========================================
        const progress = (t - 28) / 14;
        phaseTitle = 'PHASE 3: BACKSHELL SEPARATION & RETRO-ROCKET POWERED DESCENT';
        dispatchVoice =
          'Powered descent initiated! 8 hydrazine pulse thrusters active. Terminal guidance locked on landing target.';

        // Altitude 2,100 m down to 25 m
        currentAlt = 2100 - progress * 2075;
        currentVel = 80 - progress * 78; // 80 m/s down to 2 m/s
        machNum = currentVel / 240;
        atmoDensity = 0.02;
        dynPress = 0.5 * atmoDensity * Math.pow(currentVel, 2) * 0.001;
        throttlePct = 68 + Math.sin(t * 5) * 8;
        currentAccel = -3.72 + (throttlePct / 100) * 4.2;

        aeroshellGroup.visible = false;
        parachuteGroup.visible = false;
        skyCraneGroup.visible = true;
        roverGroup.visible = true;
        bridleCables.visible = false; // rover still docked inside skycrane belly

        // Rover is nestled right beneath the sky-crane
        roverGroup.position.set(0, -1.2, 0);

        // Descent height towards 20m above ground
        const descentY = 22 - progress * 16;
        spacecraftGroup.position.set(Math.sin(t * 0.5) * 0.8, descentY, 0);
        spacecraftGroup.rotation.set(Math.sin(t * 3) * 0.04, t * 0.05, Math.cos(t * 2.8) * 0.04);

        // Thruster flame flickering & lights
        const thrusterFlameScale = 0.8 + Math.random() * 0.4;
        thrusterCones.forEach((c) => {
          c.scale.set(1, thrusterFlameScale, 1);
        });
        thrusterLight1.intensity = 3.5 * thrusterFlameScale;
        thrusterLight1.position.copy(spacecraftGroup.position);
        thrusterLight2.intensity = 1.2 * thrusterFlameScale;
        thrusterLight2.position.copy(spacecraftGroup.position);

        if (lastSoundPhaseRef.current !== 3) {
          lastSoundPhaseRef.current = 3;
          playSound?.('thruster');
        }

        // Camera Director: Ground tracking camera watching the fiery craft descend
        if (cameraModeRef.current === 'director') {
          camera.position.set(22, 6, 26);
          camera.lookAt(spacecraftGroup.position);
        }
      } else if (t < 52) {
        // ==========================================
        // PHASE 4: UMBILICAL BRIDLE LOWERING & TOUCHDOWN (42s - 52s)
        // ==========================================
        const progress = (t - 42) / 10;
        phaseTitle = 'PHASE 4: SKY-CRANE UMBILICAL LOWERING & ROVER TOUCHDOWN';
        dispatchVoice =
          'Sky-Crane hovering at 20 meters. Rover umbilical bridle lowering at 0.75 m/s. Dust plumes detected.';

        // Altitude 25 m down to 0 m!
        currentAlt = Math.max(0, 25 * (1 - progress));
        currentVel = Math.max(0, 0.75 * (1 - progress));
        machNum = currentVel / 240;
        atmoDensity = 0.02;
        dynPress = 0.01;
        throttlePct = 52 + Math.random() * 5;
        currentAccel = 0;

        aeroshellGroup.visible = false;
        parachuteGroup.visible = false;
        skyCraneGroup.visible = true;
        roverGroup.visible = true;
        bridleCables.visible = progress < 0.85; // severed at touchdown!

        // Sky-crane hovers at Y=14, or flies away at end of phase
        if (progress < 0.85) {
          // Hovering
          skyCraneGroup.position.set(0, 14, 0);
          skyCraneGroup.rotation.set(Math.sin(t * 4) * 0.02, 0, 0);

          // Rover lowered on tethers from Y=14 down to ground (Y=0.5)
          const roverY = 12 - progress * 14.1;
          roverGroup.position.set(0, Math.max(0, roverY), 0);
        } else {
          // TOUCHDOWN OCCURS! Tethers cut, Skycrane throttles to 100% and flies away
          const flyAwayProg = (progress - 0.85) / 0.15;
          skyCraneGroup.position.set(flyAwayProg * 80, 14 + flyAwayProg * 45, -flyAwayProg * 100);
          skyCraneGroup.rotation.set(-0.3, 0.4, 0.2);

          // Rover rests firmly on ground, suspension settles
          roverGroup.position.set(0, 0, 0);
          wheels.forEach((w) => {
            w.position.y = 0.5 - Math.sin(t * 10) * 0.02 * (1 - flyAwayProg);
          });
        }

        // Billowing dust plume on the ground
        dustMat.opacity = Math.min(0.7, progress * 0.9);
        for (let d = 0; d < dustCount; d++) {
          const v = dustVel[d];
          const px = dustPos[d * 3] + v.x * deltaSec;
          const py = dustPos[d * 3 + 1] + v.y * deltaSec;
          const pz = dustPos[d * 3 + 2] + v.z * deltaSec;
          dustPos[d * 3] = px;
          dustPos[d * 3 + 1] = py;
          dustPos[d * 3 + 2] = pz;
          if (py > 6 || Math.hypot(px, pz) > 35) {
            dustPos[d * 3] = (Math.random() - 0.5) * 4;
            dustPos[d * 3 + 1] = 0.1;
            dustPos[d * 3 + 2] = (Math.random() - 0.5) * 4;
          }
        }
        dustAttr.needsUpdate = true;

        if (progress > 0.82 && lastSoundPhaseRef.current !== 4) {
          lastSoundPhaseRef.current = 4;
          playSound?.('touchdown');
          triggerVoice('Touchdown confirmed! Ares Explorer is safe on the surface of Mars! Gravity nominal at 3.721.');
        }

        // Camera Director: Close-up wheel contact shot
        if (cameraModeRef.current === 'director') {
          camera.position.set(3.5, 1.8, 4.2);
          camera.lookAt(0, 0.8, 0);
        }
      } else {
        // ==========================================
        // PHASE 5: SURFACE DEPLOYMENT & MISSION GO (52s - 60s)
        // ==========================================
        const progress = (t - 52) / 8;
        phaseTitle = 'PHASE 5: SYSTEMS NOMINAL • EXPEDITION DEPLOYED';
        dispatchVoice =
          'Telemetry 100% nominal. Mast camera active. Solar arrays deployed. Welcome to the Red Planet, Commander.';

        currentAlt = 0;
        currentVel = 0;
        machNum = 0;
        atmoDensity = 0.02;
        dynPress = 0;
        throttlePct = 0;
        currentAccel = 0;

        aeroshellGroup.visible = false;
        parachuteGroup.visible = false;
        skyCraneGroup.visible = false;
        roverGroup.visible = true;
        dustMat.opacity = Math.max(0, 0.7 - progress * 0.7);

        // Rover sits on ground
        roverGroup.position.set(0, 0, 0);

        // Unfold Solar Panels in 3D
        const unfoldProg = Math.min(1.0, progress * 1.5);
        solarWingLeft.rotation.z = -Math.PI * 0.48 * (1 - unfoldProg);
        solarWingRight.rotation.z = Math.PI * 0.48 * (1 - unfoldProg);

        // Mast Camera Head scans 360 degrees
        camHead.rotation.y = Math.sin(progress * Math.PI * 2) * 1.2;
        camHead.rotation.x = Math.sin(progress * Math.PI * 4) * 0.2;

        // Turn on Rover Headlight Spotlight
        roverSpotlight.intensity = 2.5 * unfoldProg;

        // Test wheel rotation
        wheels.forEach((w) => {
          w.rotation.x += 0.05;
        });

        if (lastSoundPhaseRef.current !== 5) {
          lastSoundPhaseRef.current = 5;
          playSound?.('upgrade');
        }

        // Camera Director: Hero orbital panning shot around the fully unfolded rover
        if (cameraModeRef.current === 'director') {
          const camAngle = t * 0.3;
          camera.position.set(Math.cos(camAngle) * 8.5, 3.2, Math.sin(camAngle) * 8.5);
          camera.lookAt(0, 1.2, 0);
        }
      }

      // Voice trigger for the phase
      triggerVoice(dispatchVoice);

      // Update telemetry state
      setTelemetry({
        altitude: Math.round(currentAlt),
        velocity: Math.round(currentVel),
        acceleration: Number(currentAccel.toFixed(2)),
        mach: Number(machNum.toFixed(2)),
        dynamicPressure: Number(dynPress.toFixed(2)),
        atmosphereDensity: Number(atmoDensity.toFixed(4)),
        thrusterThrottle: Math.round(throttlePct),
        phaseName: phaseTitle,
        subtitles: dispatchVoice,
      });

      // Handle custom camera modes
      if (cameraModeRef.current === 'orbit') {
        const { theta, phi, dist } = orbitAnglesRef.current;
        const targetPos = roverGroup.visible && roverGroup.position.y <= 0 ? roverGroup.position : spacecraftGroup.position;
        camera.position.set(
          targetPos.x + dist * Math.sin(phi) * Math.cos(theta),
          targetPos.y + dist * Math.cos(phi),
          targetPos.z + dist * Math.sin(phi) * Math.sin(theta)
        );
        camera.lookAt(targetPos);
      } else if (cameraModeRef.current === 'rover') {
        // Cockpit / Mast-cam perspective looking forward from rover
        camera.position.set(roverGroup.position.x + 0.6, roverGroup.position.y + 2.7, roverGroup.position.z - 0.8);
        camera.lookAt(roverGroup.position.x, roverGroup.position.y + 1.0, roverGroup.position.z + 18);
      } else if (cameraModeRef.current === 'chase') {
        const target = roverGroup.visible && roverGroup.position.y <= 0 ? roverGroup : spacecraftGroup;
        camera.position.set(target.position.x - 4, target.position.y + 5, target.position.z - 12);
        camera.lookAt(target.position.x, target.position.y + 1, target.position.z + 5);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [isOpen, playSound, triggerVoice]);

  if (!isOpen) return null;

  const handleSeek = (newTime: number) => {
    timeRef.current = newTime;
    setPlaybackTime(newTime);
    playSound?.('click');
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    playSound?.('click');
  };

  const jumpToPhase = (seconds: number) => {
    timeRef.current = seconds;
    setPlaybackTime(seconds);
    setIsPlaying(true);
    playSound?.('click');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden select-none">
      <div ref={containerRef} className="relative w-full h-full flex flex-col justify-between overflow-hidden">
        {/* 3D WebGL Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* TOP CINEMATIC HEADER BAR */}
        <div className="relative z-20 flex justify-between items-center p-3 md:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto">
          {/* Mission & Telemetry Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-[#FF3D00] animate-ping" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-orbitron font-black text-xs md:text-sm text-white tracking-wider">
                  ARES EXPLORER • 3D EDL ENTRY SIMULATION
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#4DD0E1]/20 text-[#4DD0E1] border border-[#4DD0E1]/40 font-mono font-bold">
                  GRAVITY: 3.721 m/s²
                </span>
              </div>
              <div className="text-[11px] font-orbitron font-semibold text-[#FF5722] mt-0.5">
                {telemetry.phaseName}
              </div>
            </div>
          </div>

          {/* Right Controls: Audio & Skip */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-2 rounded-xl glass-panel text-white/80 hover:text-white border border-white/20 cursor-pointer"
              title={isAudioMuted ? 'Unmute Flight Audio' : 'Mute Flight Audio'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-white/50" /> : <Volume2 className="w-4 h-4 text-[#4DD0E1]" />}
            </button>

            <button
              onClick={() => setShowTelemetry(!showTelemetry)}
              className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer ${
                showTelemetry
                  ? 'bg-[#4DD0E1]/20 text-[#4DD0E1] border-[#4DD0E1]/60'
                  : 'glass-panel text-white/60 border-white/20'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TELEMETRY</span>
            </button>

            {onOpenStoryBriefing && (
              <button
                onClick={onOpenStoryBriefing}
                className="px-3 py-1.5 rounded-xl font-orbitron font-bold text-xs glass-panel text-[#E67E22] border border-[#E67E22]/40 hover:bg-[#E67E22]/15 flex items-center space-x-1.5 transition-all cursor-pointer hidden md:flex"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>STORY BRIEFING</span>
              </button>
            )}

            <button
              onClick={onFinish}
              className="px-4 py-2 rounded-xl font-orbitron font-black text-xs md:text-sm bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black hover:opacity-90 transition-all flex items-center space-x-1.5 shadow-lg shadow-teal-900/40 cursor-pointer"
            >
              <span>COMMENCE EXPEDITION</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LEFT / CENTER: REAL-TIME PHYSICS HUD TELEMETRY PANEL */}
        {showTelemetry && (
          <div className="relative z-20 self-start ml-3 md:ml-6 max-w-xs w-full glass-panel rounded-2xl p-4 border border-[#4DD0E1]/40 bg-black/75 shadow-2xl space-y-3 pointer-events-auto backdrop-blur-md hidden sm:block">
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
              <span className="font-orbitron font-bold text-xs text-[#4DD0E1] flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#4DD0E1]" />
                <span>FLIGHT DYNAMICS</span>
              </span>
              <span className="text-[10px] font-mono text-white/60">LIVE TELEMETRY</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left font-mono">
              <div className="bg-black/60 p-2 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">ALTITUDE (h)</div>
                <div className="text-sm font-bold text-white">
                  {telemetry.altitude > 1000 ? `${(telemetry.altitude / 1000).toFixed(1)} km` : `${telemetry.altitude} m`}
                </div>
              </div>

              <div className="bg-black/60 p-2 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">VELOCITY (v)</div>
                <div className="text-sm font-bold text-[#FF9800]">{telemetry.velocity} m/s</div>
              </div>

              <div className="bg-black/60 p-2 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">MACH NUMBER</div>
                <div className="text-sm font-bold text-[#2ECC71]">M {telemetry.mach}</div>
              </div>

              <div className="bg-black/60 p-2 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">MARS GRAVITY</div>
                <div className="text-sm font-bold text-[#4DD0E1]">3.721 m/s²</div>
              </div>

              <div className="bg-black/60 p-2 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">Q (DYNAMIC P)</div>
                <div className="text-sm font-bold text-white">{telemetry.dynamicPressure} kPa</div>
              </div>

              <div className="bg-black/60 p-2 rounded-lg border border-white/10">
                <div className="text-[10px] text-white/60">THRUST THROTTLE</div>
                <div className="text-sm font-bold text-[#FF5722]">{telemetry.thrusterThrottle}%</div>
              </div>
            </div>

            <div className="text-[10px] text-white/50 text-left pt-1 border-t border-white/10">
              * Barometric Scale Height: 11.1 km • Thin CO₂ Atmosphere
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: SUBTITLES + VIDEO TIMELINE CONTROLS */}
        <div className="relative z-20 p-3 md:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-3 pointer-events-auto">
          {/* Mission Dispatch Voice Subtitle */}
          <div className="max-w-2xl mx-auto glass-panel rounded-xl px-4 py-2.5 border-l-4 border-l-[#FF5722] border-y border-r border-white/10 bg-black/80 flex items-center space-x-3 shadow-lg">
            <Radio className="w-5 h-5 text-[#FF5722] animate-pulse flex-shrink-0" />
            <p className="text-xs md:text-sm font-semibold text-white tracking-wide text-left">
              {telemetry.subtitles}
            </p>
          </div>

          {/* Phase Quick-Jumps */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 text-[11px] font-orbitron font-semibold">
            <button
              onClick={() => jumpToPhase(0)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                playbackTime < 14 ? 'bg-[#FF5722] text-white border-[#FF5722]' : 'glass-panel text-white/60 border-white/15'
              }`}
            >
              1. ENTRY (MACH 22)
            </button>
            <button
              onClick={() => jumpToPhase(14)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                playbackTime >= 14 && playbackTime < 28
                  ? 'bg-[#FF5722] text-white border-[#FF5722]'
                  : 'glass-panel text-white/60 border-white/15'
              }`}
            >
              2. PARACHUTE
            </button>
            <button
              onClick={() => jumpToPhase(28)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                playbackTime >= 28 && playbackTime < 42
                  ? 'bg-[#FF5722] text-white border-[#FF5722]'
                  : 'glass-panel text-white/60 border-white/15'
              }`}
            >
              3. RETRO-ROCKETS
            </button>
            <button
              onClick={() => jumpToPhase(42)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                playbackTime >= 42 && playbackTime < 52
                  ? 'bg-[#FF5722] text-white border-[#FF5722]'
                  : 'glass-panel text-white/60 border-white/15'
              }`}
            >
              4. SKY-CRANE TOUCHDOWN
            </button>
            <button
              onClick={() => jumpToPhase(52)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                playbackTime >= 52 ? 'bg-[#2ECC71] text-black font-bold border-[#2ECC71]' : 'glass-panel text-white/60 border-white/15'
              }`}
            >
              5. SURFACE DEPLOY
            </button>
          </div>

          {/* Interactive Video Scrub Bar */}
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="relative flex items-center group">
              <input
                type="range"
                min="0"
                max={TOTAL_DURATION}
                step="0.1"
                value={playbackTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#4DD0E1] hover:bg-white/30 transition-all"
              />
            </div>

            {/* Video Controls Row */}
            <div className="flex justify-between items-center text-xs text-[#F4F7FA]/80">
              <div className="flex items-center space-x-3">
                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer transition-all flex items-center space-x-1 font-orbitron font-bold"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                {/* Restart */}
                <button
                  onClick={() => handleSeek(0)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                  title="Replay from Beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Timestamp */}
                <div className="font-mono text-xs text-[#4DD0E1]">
                  {formatTime(playbackTime)} / {formatTime(TOTAL_DURATION)}
                </div>

                {/* Speed Toggle */}
                <div className="hidden sm:flex items-center space-x-1 border-l border-white/20 pl-3">
                  {[0.5, 1.0, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                        playbackSpeed === s ? 'bg-[#4DD0E1] text-black font-bold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Angle Selector */}
              <div className="flex items-center space-x-1.5">
                <span className="hidden md:inline font-orbitron text-[11px] text-white/60 mr-1 flex items-center">
                  <Camera className="w-3.5 h-3.5 mr-1 text-[#4DD0E1]" />
                  CAMERA:
                </span>
                {(
                  [
                    { id: 'director', label: 'DIRECTOR' },
                    { id: 'orbit', label: '3D ORBIT' },
                    { id: 'rover', label: 'MAST-CAM' },
                    { id: 'chase', label: 'CHASE' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setCameraMode(cam.id);
                      playSound?.('click');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-orbitron text-[10px] md:text-xs font-bold transition-all cursor-pointer ${
                      cameraMode === cam.id
                        ? 'bg-[#4DD0E1] text-black shadow-md shadow-cyan-900/40'
                        : 'glass-panel text-white/60 border border-white/15 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
