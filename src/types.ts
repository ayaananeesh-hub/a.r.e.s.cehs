export type BiomeKey = 'basalt' | 'dunes' | 'ice' | 'volcanic' | 'lava' | 'summit';

export interface BiomeInfo {
  drag: number;
  accelMult: number;
  maxSpeed?: number;
  turnRate?: number;
  tractionDesc?: string;
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
  health: number;
  maxHealth: number;
  battery: number;
  solarEff: number;
  dust: number;
  coins?: number;
  pointsSpent?: number;
  totalPointsEarned?: number;
  tunedSpeedLevel?: number;
  tunedArmorLevel?: number;
  tunedBatteryLevel?: number;
  tunedSolarLevel?: number;
  headlightsOn?: boolean;
  mode: string;
  sciencePoints: number;
  steering?: number;
  upgrades: RoverUpgrades;
  customization: RoverCustomization;
  unlockedSkins: string[];
  unlockedWheels: string[];
  unlockedLights: string[];
  unlockedTrails: string[];
}

export interface CharacterProfile {
  id: string; // lowercase trimmed identifier e.g. 'ayaan'
  name: string; // display name e.g. 'Ayaan'
  passcode?: string; // Secure account passcode for cross-device persistence
  hasPasscode?: boolean; // Flag indicating if account is protected with a passcode
  titleHonorific?: string; // e.g. 'Chief Astrobiologist' or 'A.R.E.S. Core Protocol'
  coins: number; // Current coins / points available
  pointsSpent: number; // Total points used / spent so far
  totalPointsEarned: number; // Lifetime total points earned
  currentLevelNum: number;
  createdAt: string;
  lastPlayedAt: string;
  rover: RoverState;
  discoveries: DiscoveryItem[];
  levels: Record<number, LevelConfig>;
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
  chemicalFormula?: string;
  astroPotential?: string;
  category?: string;
  density?: string;
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

export interface RockObstacle {
  id?: string;
  x: number;
  y: number;
  radius: number; // Collision and visual radius
  height?: number; // Visual 3D height
  shape?: number; // Seed for polygon irregularity
  color?: string; // Color override or biome tone
}

export interface LevelConfig {
  title: string;
  subtitle: string;
  name?: string;
  scientificTitle?: string;
  mapWidth: number;
  mapHeight: number;
  startPos: { x: number; y: number };
  bg: string;
  biome: BiomeKey;
  objectives: ObjectiveItem[];
  targets: TargetItem[];
  lavaZones?: LavaZone[];
  lavaPaths?: LavaPath[];
  rocks?: RockObstacle[];
}

export interface DiscoveryItem {
  title: string;
  desc: string;
  coords: string;
  temp: string;
  chemicalFormula?: string;
  astroPotential?: string;
  category?: string;
  density?: string;
  epoch?: string;
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
