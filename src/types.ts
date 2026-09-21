export type BiomeKey = 'basalt' | 'dunes' | 'ice' | 'volcanic' | 'lava' | 'summit';

export interface BiomeInfo {
  drag: number;
  accelMult: number;
  color: string;
  name: string;
}

export interface RoverCustomization {
  skin: string;
  wheel: string;
  light: string;
  trail: string;
}

export interface RoverUpgrades {
  duneTreads: boolean;
  iceRadar: boolean;
  stormShield: boolean;
  lavaPlates?: boolean;
  quantumUplink?: boolean;
}

export interface RoverState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  battery: number;
  solarEff: number;
  dust: number;
  mode: string;
  sciencePoints: number;
  upgrades: RoverUpgrades;
  customization: RoverCustomization;
  unlockedSkins: string[];
  unlockedWheels: string[];
  unlockedLights: string[];
  unlockedTrails: string[];
}

export interface ObjectiveItem {
  id: string;
  text: string;
  done: boolean;
  pos?: { x: number; y: number };
}

export interface TargetItem {
  type: 'station' | 'sample' | 'relay' | 'ice' | 'settlement';
  name: string;
  x: number;
  y: number;
  minigame?: number;
  visited?: boolean;
  collected?: boolean;
  scanned?: boolean;
  marked?: boolean;
  info?: string;
}

export interface LavaZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LavaPath {
  type: 'segment' | 'island';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  cx?: number;
  cy?: number;
  radius?: number;
}

export interface LevelConfig {
  title: string;
  subtitle: string;
  mapWidth: number;
  mapHeight: number;
  startPos: { x: number; y: number };
  bg: string;
  biome: BiomeKey;
  objectives: ObjectiveItem[];
  targets: TargetItem[];
  lavaZones?: LavaZone[];
  lavaPaths?: LavaPath[];
}

export interface DiscoveryItem {
  title: string;
  desc: string;
  coords: string;
  temp: string;
}

export interface SkinItem {
  id: string;
  name: string;
  color: string;
  cost: number;
}

export interface WheelItem {
  id: string;
  name: string;
  color: string;
  rimColor: string;
  cost: number;
}

export interface LightItem {
  id: string;
  name: string;
  color: string;
  cost: number;
}

export interface TrailItem {
  id: string;
  name: string;
  cost: number;
}

export interface CustomizationCatalog {
  skins: SkinItem[];
  wheels: WheelItem[];
  lights: LightItem[];
  trails: TrailItem[];
}
