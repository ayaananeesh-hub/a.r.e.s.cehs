import { BiomeInfo, BiomeKey, CustomizationCatalog, LevelConfig, RoverState } from '../types';

export const biomeTypes: Record<BiomeKey, BiomeInfo> = {
  basalt: { drag: 0.88, accelMult: 1.0, color: '#9E2A1B', name: 'BASALT CANYON' },
  dunes: { drag: 0.82, accelMult: 0.85, color: '#E67E22', name: 'GOLDEN SAND DUNES' },
  ice: { drag: 0.96, accelMult: 0.70, color: '#4DD0E1', name: 'POLAR ICE CAP' },
  volcanic: { drag: 0.86, accelMult: 0.80, color: '#FF5722', name: 'VOLCANIC CALDERA' },
  lava: { drag: 0.84, accelMult: 0.85, color: '#FF3D00', name: 'CERBERUS LAVA CHASM' },
  summit: { drag: 0.90, accelMult: 1.05, color: '#7E57C2', name: 'OLYMPUS MONS SUMMIT' }
};

export const customizationCatalog: CustomizationCatalog = {
  skins: [
    { id: 'classic', name: 'Ares Orange', color: '#E67E22', cost: 0 },
    { id: 'cyber', name: 'Cyber Cyan', color: '#00E5FF', cost: 50 },
    { id: 'gold', name: 'Solar Gold', color: '#F1C40F', cost: 100 },
    { id: 'stealth', name: 'Stealth Black', color: '#2C3E50', cost: 150 },
    { id: 'emerald', name: 'Neon Emerald', color: '#2ECC71', cost: 200 }
  ],
  wheels: [
    { id: 'standard', name: 'Titanium Alloys', color: '#080F1E', rimColor: '#7F8C8D', cost: 0 },
    { id: 'spikes', name: 'Cyber Tread Spikes', color: '#1A252C', rimColor: '#E67E22', cost: 75 },
    { id: 'plasma', name: 'Plasma Glow Rims', color: '#111', rimColor: '#00E5FF', cost: 125 }
  ],
  lights: [
    { id: 'cyan', name: 'Cyan Beam', color: '#4DD0E1', cost: 0 },
    { id: 'amber', name: 'Solar Amber', color: '#F39C12', cost: 40 },
    { id: 'crimson', name: 'Crimson Pulse', color: '#E74C3C', cost: 80 },
    { id: 'violet', name: 'Plasma Violet', color: '#9B59B6', cost: 120 }
  ],
  trails: [
    { id: 'none', name: 'No Trail', cost: 0 },
    { id: 'dust', name: 'Red Dust Cloud', cost: 0 },
    { id: 'cyber', name: 'Neon Trail Streamer', cost: 100 }
  ]
};

export const storyScenes = [
  { title: "THE RED FRONTIER", text: "Earth's resources are depleting. Humanity looks to Mars as our next home.", color: "#E67E22" },
  { title: "THE ROVER DEPLOYMENT", text: "Ares Explorer landing capsule deployed into the harsh terrain of Basalt Canyon.", color: "#4DD0E1" },
  { title: "TERRAIN CHALLENGES", text: "Dust storms and rocky slopes threaten rover treads and solar power efficiency.", color: "#FF5722" },
  { title: "SUBSURFACE DISCOVERIES", text: "Ancient riverbeds hold hidden glaciers vital for sustaining life.", color: "#2ECC71" },
  { title: "CERBERUS LAVA CHASM", text: "Traverse rivers of molten magma. You must strictly stay on designated basalt bridges to survive!", color: "#FF3D00" },
  { title: "OLYMPUS MONS SUMMIT", text: "Ascend Mars' highest peak at 21 kilometers altitude to establish humanity's final colony dome.", color: "#9B59B6" }
];

export const defaultRoverState: RoverState = {
  x: 400,
  y: 400,
  vx: 0,
  vy: 0,
  angle: 0,
  speed: 0,
  battery: 100,
  solarEff: 100,
  dust: 0,
  mode: 'EXPLORATION',
  sciencePoints: 100,
  upgrades: {
    duneTreads: false,
    iceRadar: false,
    stormShield: false,
    lavaPlates: false,
    quantumUplink: false
  },
  customization: {
    skin: 'classic',
    wheel: 'standard',
    light: 'cyan',
    trail: 'dust'
  },
  unlockedSkins: ['classic'],
  unlockedWheels: ['standard'],
  unlockedLights: ['cyan'],
  unlockedTrails: ['none', 'dust']
};

export function isPointInLava(x: number, y: number, level: LevelConfig): boolean {
  if (!level.lavaZones || level.lavaZones.length === 0) return false;

  // 1. Is point inside ANY lava hazard zone?
  let insideLavaZone = false;
  for (const lz of level.lavaZones) {
    if (x >= lz.x && x <= lz.x + lz.width && y >= lz.y && y <= lz.y + lz.height) {
      insideLavaZone = true;
      break;
    }
  }
  if (!insideLavaZone) return false;

  // 2. Is point on ANY safe path or island?
  if (!level.lavaPaths || level.lavaPaths.length === 0) return true;

  for (const p of level.lavaPaths) {
    if (p.type === 'island' && p.cx !== undefined && p.cy !== undefined && p.radius !== undefined) {
      const dist = Math.hypot(x - p.cx, y - p.cy);
      if (dist <= p.radius) {
        return false; // Safe on island
      }
    } else if (
      p.type === 'segment' &&
      p.x1 !== undefined &&
      p.y1 !== undefined &&
      p.x2 !== undefined &&
      p.y2 !== undefined
    ) {
      const w = p.width || 100;
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        if (Math.hypot(x - p.x1, y - p.y1) <= w / 2) return false;
      } else {
        const t = Math.max(0, Math.min(1, ((x - p.x1) * dx + (y - p.y1) * dy) / lenSq));
        const projX = p.x1 + t * dx;
        const projY = p.y1 + t * dy;
        const dist = Math.hypot(x - projX, y - projY);
        if (dist <= w / 2) {
          return false; // Safe on basalt bridge
        }
      }
    }
  }

  // Inside lava zone and NOT on any safe path -> IN LAVA!
  return true;
}

export function getNearestSafePathPoint(x: number, y: number, level: LevelConfig): { x: number; y: number } {
  if (!level.lavaPaths || level.lavaPaths.length === 0) {
    return level.startPos;
  }
  let bestDist = Infinity;
  let bestPoint = { x: level.startPos.x, y: level.startPos.y };

  for (const p of level.lavaPaths) {
    if (p.type === 'island' && p.cx !== undefined && p.cy !== undefined) {
      const dist = Math.hypot(x - p.cx, y - p.cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestPoint = { x: p.cx, y: p.cy };
      }
    } else if (
      p.type === 'segment' &&
      p.x1 !== undefined &&
      p.y1 !== undefined &&
      p.x2 !== undefined &&
      p.y2 !== undefined
    ) {
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq > 0) {
        const t = Math.max(0, Math.min(1, ((x - p.x1) * dx + (y - p.y1) * dy) / lenSq));
        const px = p.x1 + t * dx;
        const py = p.y1 + t * dy;
        const dist = Math.hypot(x - px, y - py);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = { x: px, y: py };
        }
      }
    }
  }
  return bestPoint;
}

export function getInitialLevels(): Record<number, LevelConfig> {
  return {
    1: {
      title: "LEVEL 1: CRATERS & BASALT CANYON",
      subtitle: "Basalt Canyon Exploration",
      mapWidth: 2200,
      mapHeight: 2200,
      startPos: { x: 400, y: 400 },
      bg: '#9E2A1B',
      biome: 'basalt',
      objectives: [
        { id: 'move', text: 'Leave capsule zone and enter Basalt Canyon.', done: false },
        { id: 'upgrade1', text: 'Visit Workshop Station & complete Gear Traction Minigame.', done: false, pos: { x: 800, y: 800 } },
        { id: 'sample1', text: 'Scan & collect basalt mineral sample.', done: false, pos: { x: 1200, y: 650 } },
        { id: 'transmit', text: 'Transmit canyon data to Earth relay.', done: false, pos: { x: 1600, y: 1600 } }
      ],
      targets: [
        { type: 'station', name: 'Engineering Station Alpha', x: 800, y: 800, minigame: 1, visited: false },
        { type: 'sample', name: 'Basalt Mineral Deposit', x: 1200, y: 650, collected: false, info: 'Volcanic basalt rich in iron and olivine.' },
        { type: 'relay', name: 'Earth Antenna Relay', x: 1600, y: 1600, visited: false }
      ]
    },
    2: {
      title: "LEVEL 2: GRAND SAND DUNES",
      subtitle: "Ancient Riverbed & Dune Field",
      mapWidth: 2600,
      mapHeight: 2600,
      startPos: { x: 350, y: 350 },
      bg: '#E67E22',
      biome: 'dunes',
      objectives: [
        { id: 'upgrade2', text: 'Visit Dune Workshop & complete Wave Radar Minigame.', done: false, pos: { x: 850, y: 850 } },
        { id: 'radarIce', text: 'Use Ice Radar (SPACE) near riverbed to scan underground ice.', done: false, pos: { x: 1450, y: 1250 } },
        { id: 'reachTower', text: 'Reach high ridge comm tower.', done: false, pos: { x: 2200, y: 2100 } }
      ],
      targets: [
        { type: 'station', name: 'Dune Workshop Relay', x: 850, y: 850, minigame: 2, visited: false },
        { type: 'ice', name: 'Subsurface Permafrost Ice', x: 1450, y: 1250, scanned: false, info: 'Underground glacier sheet 0.4m beneath dune silt.' },
        { type: 'relay', name: 'Dune Comm Tower', x: 2200, y: 2100, visited: false }
      ]
    },
    3: {
      title: "LEVEL 3: POLAR ICE CAP & VOLCANO",
      subtitle: "Glacier Ridge & Volcanic Caldera",
      mapWidth: 3200,
      mapHeight: 3200,
      startPos: { x: 450, y: 450 },
      bg: '#080F1E',
      biome: 'ice',
      objectives: [
        { id: 'upgrade3', text: 'Visit Glacier Workshop & complete Shield Circuit Minigame.', done: false, pos: { x: 900, y: 900 } },
        { id: 'volcanoScan', text: 'Scan magma vent for thermal energy.', done: false, pos: { x: 1900, y: 1600 } },
        { id: 'markSettlement', text: 'Mark future human settlement site.', done: false, pos: { x: 2700, y: 2600 } }
      ],
      targets: [
        { type: 'station', name: 'Polar Shield Workshop', x: 900, y: 900, minigame: 3, visited: false },
        { type: 'sample', name: 'Geothermal Magma Vent', x: 1900, y: 1600, collected: false, info: 'Geothermal volcanic fissure providing power potential.' },
        { type: 'settlement', name: 'Settlement Zone Alpha', x: 2700, y: 2600, marked: false }
      ]
    },
    4: {
      title: "LEVEL 4: CERBERUS FOSSAE LAVA CHASM",
      subtitle: "Molten Magma Lakes & Basalt Bridges",
      mapWidth: 3400,
      mapHeight: 3400,
      startPos: { x: 350, y: 1700 },
      bg: '#140300',
      biome: 'lava',
      objectives: [
        { id: 'upgrade4', text: 'Visit Lava Forge Workshop & install Thermal Dampers.', done: false, pos: { x: 1000, y: 1700 } },
        { id: 'crossChasm', text: 'Cross Basalt Bridge over lava lake to Central Core Island.', done: false, pos: { x: 1700, y: 1700 } },
        { id: 'magmaSample', text: 'Extract Superheated Pyroxene crystal from core island.', done: false, pos: { x: 1700, y: 1700 } },
        { id: 'geoGenerator', text: 'Cross South Causeway to activate Geothermal Power Generator.', done: false, pos: { x: 1700, y: 2400 } }
      ],
      targets: [
        { type: 'station', name: 'Lava Forge Workshop', x: 1000, y: 1700, minigame: 3, visited: false },
        { type: 'sample', name: 'Superheated Pyroxene Crystal', x: 1700, y: 1700, collected: false, info: 'Deep mantle igneous crystal formed in boiling 1200°C magma.' },
        { type: 'relay', name: 'Geothermal Power Generator', x: 1700, y: 2400, visited: false },
        { type: 'sample', name: 'North Volcanic Fissure Vent', x: 1700, y: 1000, collected: false, info: 'Sulfur-rich chimney spewing superheated volcanic steam.' }
      ],
      lavaZones: [
        { x: 600, y: 600, width: 2200, height: 2200 }
      ],
      lavaPaths: [
        { type: 'segment', x1: 250, y1: 1700, x2: 1000, y2: 1700, width: 130 },
        { type: 'island', cx: 1000, cy: 1700, radius: 130 },
        { type: 'segment', x1: 1000, y1: 1700, x2: 1700, y2: 1700, width: 115 },
        { type: 'island', cx: 1700, cy: 1700, radius: 150 },
        { type: 'segment', x1: 1700, y1: 1700, x2: 1700, y2: 1000, width: 105 },
        { type: 'island', cx: 1700, cy: 1000, radius: 120 },
        { type: 'segment', x1: 1700, y1: 1700, x2: 1700, y2: 2400, width: 105 },
        { type: 'island', cx: 1700, cy: 2400, radius: 130 },
        { type: 'segment', x1: 1700, y1: 1700, x2: 2400, y2: 1700, width: 110 },
        { type: 'island', cx: 2400, cy: 1700, radius: 120 },
        { type: 'segment', x1: 2400, y1: 1700, x2: 3150, y2: 1700, width: 130 },
        { type: 'segment', x1: 1700, y1: 1000, x2: 2400, y2: 1700, width: 95 },
        { type: 'segment', x1: 1700, y1: 2400, x2: 2400, y2: 1700, width: 95 }
      ]
    },
    5: {
      title: "LEVEL 5: OLYMPUS MONS SUMMIT",
      subtitle: "The Solar Peak & Final Colonization",
      mapWidth: 3600,
      mapHeight: 3600,
      startPos: { x: 450, y: 450 },
      bg: '#050816',
      biome: 'summit',
      objectives: [
        { id: 'upgrade5', text: 'Visit Apex Engineering Nexus & calibrate Solar Quantum Shielding.', done: false, pos: { x: 900, y: 900 } },
        { id: 'summitSample', text: 'Gather rare Olivine Crystals from the caldera rim.', done: false, pos: { x: 1800, y: 1300 } },
        { id: 'quantumArray', text: 'Align Deep Space Quantum Uplink dish to Earth.', done: false, pos: { x: 2600, y: 1500 } },
        { id: 'colonyDome', text: 'Power up the Primary Colonization Habitat Dome!', done: false, pos: { x: 2700, y: 2700 } }
      ],
      targets: [
        { type: 'station', name: 'Apex Engineering Nexus', x: 900, y: 900, minigame: 2, visited: false },
        { type: 'sample', name: 'Summit Olivine Crystal', x: 1800, y: 1300, collected: false, info: 'Ultra-pure green olivine formed under immense pressure at 21km altitude.' },
        { type: 'relay', name: 'Deep Space Quantum Uplink', x: 2600, y: 1500, visited: false },
        { type: 'settlement', name: 'Colony Habitat Dome Alpha', x: 2700, y: 2700, marked: false }
      ]
    }
  };
}
