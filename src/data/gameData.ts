import { BiomeInfo, BiomeKey, CustomizationCatalog, LevelConfig, RoverState } from '../types';

export const biomeTypes: Record<BiomeKey, BiomeInfo> = {
  basalt: {
    drag: 0.88,
    accelMult: 1.0,
    maxSpeed: 3.2,
    turnRate: 0.040,
    tractionDesc: 'VALLES MARINERIS • MELAS CHASMA BASALT BEDROCK',
    color: '#9E2A1B',
    name: 'Valles Marineris: Melas Chasma Basalt Bedrock'
  },
  dunes: {
    drag: 0.76, // High rolling resistance in fine powdery Martian sand
    accelMult: 0.65, // Wheels spin in loose sand
    maxSpeed: 2.2, // Slower top speed without Dune Treads
    turnRate: 0.032, // Sluggish steering in sand
    tractionDesc: 'JEZERO CRATER • NERETVA VALLIS PALEOLAKE & BARCHAN DUNES',
    color: '#E67E22',
    name: 'Jezero Crater: Neretva Vallis Paleolake & Barchan Dunes'
  },
  ice: {
    drag: 0.985, // Very low friction; long sliding distance
    accelMult: 0.60, // Wheel spin on ice
    maxSpeed: 3.8, // Glides fast, but high momentum drift
    turnRate: 0.036, // Slips on turns
    tractionDesc: 'PLANUM BOREUM • CHASMA BOREALE WATER-ICE CRYOSPHERE',
    color: '#4DD0E1',
    name: 'Planum Boreum: Chasma Boreale Glacial Permafrost'
  },
  volcanic: {
    drag: 0.85,
    accelMult: 0.82,
    maxSpeed: 2.8,
    turnRate: 0.037,
    tractionDesc: 'ELYSIUM PLANITIA • HECATES THOLUS PYROCLASTIC TEPHRA',
    color: '#FF5722',
    name: 'Elysium Planitia: Hecates Tholus Volcanic Caldera'
  },
  lava: {
    drag: 0.84,
    accelMult: 0.80,
    maxSpeed: 2.6,
    turnRate: 0.035,
    tractionDesc: 'CERBERUS FOSSAE • ATHABASCA BASALT RIFT GRABEN',
    color: '#FF3D00',
    name: 'Cerberus Fossae: Athabasca Valles Fissure Graben'
  },
  summit: {
    drag: 0.90,
    accelMult: 0.75, // Steep mountain ascent resistance
    maxSpeed: 2.5, // Uphill grade climb penalty
    turnRate: 0.036,
    tractionDesc: 'OLYMPUS MONS • 21KM ESCARPMENT & SOLAR SUMMIT AUREOLE',
    color: '#7E57C2',
    name: 'Olympus Mons: Western Caldera Aureole & Solar Summit'
  }
};

export const customizationCatalog: CustomizationCatalog = {
  skins: [
    { id: 'classic', name: 'Ares Orange', color: '#E67E22', cost: 0 },
    { id: 'cyber', name: 'Cyber Cyan', color: '#00E5FF', cost: 50 },
    { id: 'gold', name: 'Solar Gold', color: '#F1C40F', cost: 100 },
    { id: 'stealth', name: 'Stealth Black', color: '#2C3E50', cost: 150 },
    { id: 'emerald', name: 'Neon Emerald', color: '#2ECC71', cost: 200 },
    { id: 'hyperion', name: 'Supernova Magenta', color: '#FF007F', cost: 220 },
    { id: 'aurora', name: 'Electric Aurora Violet', color: '#9D00FF', cost: 250 },
    { id: 'frostbite', name: 'Titanium Ice Pearl', color: '#E0F7FA', cost: 280 }
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
  health: 100,
  maxHealth: 100,
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
      title: "LEVEL 1: VALLES MARINERIS • MELAS CHASMA",
      subtitle: "Melas Chasma Basalt Bedrock Exploration",
      mapWidth: 2200,
      mapHeight: 2200,
      startPos: { x: 400, y: 400 },
      bg: '#9E2A1B',
      biome: 'basalt',
      objectives: [
        { id: 'move', text: 'Leave capsule zone and enter Melas Chasma canyon floor.', done: false },
        { id: 'upgrade1', text: 'Visit Workshop Station & complete Gear Traction Minigame.', done: false, pos: { x: 800, y: 800 } },
        { id: 'sample1', text: 'Drill & collect Noachian basalt bedrock core.', done: false, pos: { x: 1200, y: 650 } },
        { id: 'transmit', text: 'Transmit canyon data to Earth relay.', done: false, pos: { x: 1600, y: 1600 } }
      ],
      targets: [
        { type: 'station', name: 'Melas Engineering Station Alpha', x: 800, y: 800, minigame: 1, visited: false },
        {
          type: 'sample',
          name: 'Melas Basalt Bedrock Core',
          x: 1200,
          y: 650,
          collected: false,
          info: 'Tholeiitic basalt bedrock rich in pyroxene, plagioclase, and magnesium-rich olivine. Represents primordial Noachian planetary crust exposed by monumental tectonic rifting.',
          chemicalFormula: '(Mg,Fe)₂SiO₄ + CaAl₂Si₂O₈',
          astroPotential: 'MODERATE - Radiolytic Hydrogen Energy for Subsurface Microbes',
          category: 'THOLEIITIC BASALT CRUST',
          density: '3.08 g/cm³'
        },
        { type: 'relay', name: 'Earth Antenna Relay', x: 1600, y: 1600, visited: false }
      ],
      rocks: [
        { x: 550, y: 420, radius: 24, height: 18, shape: 1 },
        { x: 620, y: 700, radius: 30, height: 22, shape: 2 },
        { x: 720, y: 520, radius: 22, height: 16, shape: 3 },
        { x: 950, y: 620, radius: 34, height: 26, shape: 4 },
        { x: 1050, y: 880, radius: 28, height: 20, shape: 5 },
        { x: 1120, y: 520, radius: 26, height: 19, shape: 1 },
        { x: 1350, y: 720, radius: 32, height: 24, shape: 2 },
        { x: 1420, y: 950, radius: 28, height: 20, shape: 3 },
        { x: 1550, y: 1250, radius: 36, height: 28, shape: 4 },
        { x: 1300, y: 1400, radius: 25, height: 18, shape: 5 },
        { x: 1100, y: 1550, radius: 30, height: 22, shape: 1 },
        { x: 850, y: 1300, radius: 27, height: 20, shape: 2 },
        { x: 680, y: 1100, radius: 32, height: 25, shape: 3 },
        { x: 500, y: 1250, radius: 26, height: 19, shape: 4 },
        { x: 600, y: 1600, radius: 35, height: 27, shape: 5 },
        { x: 850, y: 1750, radius: 29, height: 21, shape: 1 },
        { x: 1400, y: 1750, radius: 33, height: 25, shape: 2 },
        { x: 1750, y: 1450, radius: 28, height: 20, shape: 3 },
        { x: 1800, y: 1750, radius: 30, height: 22, shape: 4 },
        { x: 1650, y: 1900, radius: 26, height: 18, shape: 5 }
      ]
    },
    2: {
      title: "LEVEL 2: JEZERO CRATER • NERETVA VALLIS",
      subtitle: "Ancient Paleolake Delta & Barchan Dunes",
      mapWidth: 2600,
      mapHeight: 2600,
      startPos: { x: 350, y: 350 },
      bg: '#E67E22',
      biome: 'dunes',
      objectives: [
        { id: 'upgrade2', text: 'Visit Dune Workshop & complete Wave Radar Minigame.', done: false, pos: { x: 850, y: 850 } },
        { id: 'radarIce', text: 'Use Ice Radar (SPACE) near ancient paleolake bed to scan subsurface ice.', done: false, pos: { x: 1450, y: 1250 } },
        { id: 'reachTower', text: 'Reach high delta rim comm tower.', done: false, pos: { x: 2200, y: 2100 } }
      ],
      targets: [
        { type: 'station', name: 'Neretva Workshop Relay', x: 850, y: 850, minigame: 2, visited: false },
        {
          type: 'ice',
          name: 'Neretva Subsurface Permafrost Ice',
          x: 1450,
          y: 1250,
          scanned: false,
          info: 'Glacial cryo-lens buried 0.4m beneath fine aeolian quartz-silt. Formed during the late Hesperian lacustrine drying phase; contains preserved ancient water molecules.',
          chemicalFormula: 'H₂O(s) + CO₂(s) Hydrate Matrix',
          astroPotential: 'CRITICAL - Preserved Paleolake Micro-Biosignatures',
          category: 'LACUSTRINE CRYOSPHERE',
          density: '0.94 g/cm³'
        },
        { type: 'relay', name: 'Jezero Delta Comm Tower', x: 2200, y: 2100, visited: false }
      ],
      rocks: [
        { x: 500, y: 480, radius: 25, height: 18, shape: 1 },
        { x: 680, y: 380, radius: 32, height: 24, shape: 2 },
        { x: 720, y: 680, radius: 28, height: 20, shape: 3 },
        { x: 1020, y: 720, radius: 35, height: 26, shape: 4 },
        { x: 1180, y: 920, radius: 30, height: 22, shape: 5 },
        { x: 1300, y: 1100, radius: 27, height: 19, shape: 1 },
        { x: 1600, y: 1180, radius: 34, height: 25, shape: 2 },
        { x: 1350, y: 1380, radius: 29, height: 21, shape: 3 },
        { x: 1200, y: 1600, radius: 36, height: 28, shape: 4 },
        { x: 950, y: 1450, radius: 24, height: 17, shape: 5 },
        { x: 780, y: 1700, radius: 31, height: 23, shape: 1 },
        { x: 1050, y: 1900, radius: 28, height: 20, shape: 2 },
        { x: 1450, y: 1850, radius: 33, height: 25, shape: 3 },
        { x: 1700, y: 1600, radius: 30, height: 22, shape: 4 },
        { x: 1900, y: 1400, radius: 26, height: 19, shape: 5 },
        { x: 1850, y: 1850, radius: 35, height: 26, shape: 1 },
        { x: 2050, y: 1950, radius: 28, height: 20, shape: 2 },
        { x: 2350, y: 1950, radius: 32, height: 24, shape: 3 },
        { x: 2050, y: 2250, radius: 27, height: 19, shape: 4 },
        { x: 2350, y: 2250, radius: 34, height: 25, shape: 5 }
      ]
    },
    3: {
      title: "LEVEL 3: PLANUM BOREUM • CHASMA BOREALE",
      subtitle: "Glacial Permafrost & Elysium Volcanic Ridge",
      mapWidth: 3200,
      mapHeight: 3200,
      startPos: { x: 450, y: 450 },
      bg: '#080F1E',
      biome: 'ice',
      objectives: [
        { id: 'upgrade3', text: 'Visit Glacier Workshop & complete Shield Circuit Minigame.', done: false, pos: { x: 900, y: 900 } },
        { id: 'volcanoScan', text: 'Scan geothermal magma vent for sub-ice heat.', done: false, pos: { x: 1900, y: 1600 } },
        { id: 'markSettlement', text: 'Mark future human settlement dome site.', done: false, pos: { x: 2700, y: 2600 } }
      ],
      targets: [
        { type: 'station', name: 'Chasma Boreale Shield Workshop', x: 900, y: 900, minigame: 3, visited: false },
        {
          type: 'sample',
          name: 'Chasma Boreale Geothermal Magma Vent',
          x: 1900,
          y: 1600,
          collected: false,
          info: 'Sub-glacial volcanic fumarole venting sulfurous compounds and hydrothermal water vapor into glacial crevasses. A prime candidate for geothermal power and sub-ice habitats.',
          chemicalFormula: 'H₂S + SO₂ + FeS₂ + H₂O(v)',
          astroPotential: 'EXTREME - Chemoautotrophic Thermophilic Colony Ecosystem',
          category: 'SUBGLACIAL HYDROTHERMAL',
          density: '2.84 g/cm³'
        },
        { type: 'settlement', name: 'Planum Boreum Settlement Zone Alpha', x: 2700, y: 2600, marked: false }
      ],
      rocks: [
        { x: 650, y: 550, radius: 28, height: 22, shape: 1 },
        { x: 750, y: 780, radius: 34, height: 26, shape: 2 },
        { x: 1100, y: 750, radius: 30, height: 23, shape: 3 },
        { x: 1250, y: 1050, radius: 36, height: 28, shape: 4 },
        { x: 1450, y: 880, radius: 29, height: 21, shape: 5 },
        { x: 1650, y: 1150, radius: 33, height: 25, shape: 1 },
        { x: 1550, y: 1450, radius: 38, height: 30, shape: 2 },
        { x: 1750, y: 1750, radius: 32, height: 24, shape: 3 },
        { x: 2050, y: 1450, radius: 35, height: 27, shape: 4 },
        { x: 2150, y: 1750, radius: 30, height: 22, shape: 5 },
        { x: 1950, y: 2050, radius: 28, height: 20, shape: 1 },
        { x: 2250, y: 2150, radius: 36, height: 28, shape: 2 },
        { x: 2450, y: 2050, radius: 31, height: 23, shape: 3 },
        { x: 2500, y: 2350, radius: 34, height: 26, shape: 4 },
        { x: 2850, y: 2400, radius: 30, height: 22, shape: 5 },
        { x: 2550, y: 2750, radius: 35, height: 27, shape: 1 },
        { x: 2850, y: 2800, radius: 32, height: 24, shape: 2 },
        { x: 1400, y: 1900, radius: 37, height: 29, shape: 3 },
        { x: 1100, y: 1800, radius: 29, height: 21, shape: 4 },
        { x: 1000, y: 1400, radius: 33, height: 25, shape: 5 }
      ]
    },
    4: {
      title: "LEVEL 4: CERBERUS FOSSAE • ATHABASCA RIFT",
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
        { type: 'station', name: 'Athabasca Lava Forge Workshop', x: 1000, y: 1700, minigame: 3, visited: false },
        {
          type: 'sample',
          name: 'Athabasca Superheated Pyroxene Crystal',
          x: 1700,
          y: 1700,
          collected: false,
          info: 'High-pressure clinopyroxene single crystal extracted from late Amazonian fissure lava. Formed in magma chambers at 1200°C; demonstrates deep Martian mantle convection dynamics.',
          chemicalFormula: 'Ca(Mg,Fe)Si₂O₆ (Augite Matrix)',
          astroPotential: 'LOW - High-Temperature Abiotic Igneous Melt',
          category: 'MANTLE PYROXENE CRYSTAL',
          density: '3.42 g/cm³'
        },
        { type: 'relay', name: 'Athabasca Geothermal Generator', x: 1700, y: 2400, visited: false },
        {
          type: 'sample',
          name: 'North Volcanic Fissure Vent',
          x: 1700,
          y: 1000,
          collected: false,
          info: 'Elemental sulfur-encrusted chimney venting gaseous HCl, SO₂, and superheated volcanic steam.',
          chemicalFormula: 'S₈ + FeS₂ + HCl',
          astroPotential: 'MODERATE - Acidophilic Prebiotic Synthesis',
          category: 'VOLCANIC SUBLIMATE',
          density: '2.07 g/cm³'
        }
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
      ],
      rocks: [
        { x: 500, y: 1620, radius: 26, height: 20, shape: 1 },
        { x: 520, y: 1780, radius: 28, height: 22, shape: 2 },
        { x: 920, y: 1610, radius: 25, height: 19, shape: 3 },
        { x: 1080, y: 1790, radius: 27, height: 21, shape: 4 },
        { x: 1300, y: 1620, radius: 28, height: 22, shape: 5 },
        { x: 1450, y: 1780, radius: 26, height: 20, shape: 1 },
        { x: 1610, y: 1610, radius: 24, height: 18, shape: 2 },
        { x: 1790, y: 1790, radius: 25, height: 19, shape: 3 },
        { x: 1620, y: 1350, radius: 26, height: 20, shape: 4 },
        { x: 1780, y: 1180, radius: 28, height: 22, shape: 5 },
        { x: 1610, y: 2100, radius: 27, height: 21, shape: 1 },
        { x: 1790, y: 2250, radius: 25, height: 19, shape: 2 },
        { x: 2100, y: 1620, radius: 28, height: 22, shape: 3 },
        { x: 2250, y: 1780, radius: 26, height: 20, shape: 4 },
        { x: 2600, y: 1620, radius: 30, height: 24, shape: 5 },
        { x: 2800, y: 1780, radius: 32, height: 25, shape: 1 },
        { x: 2050, y: 1350, radius: 29, height: 23, shape: 2 },
        { x: 2050, y: 2050, radius: 31, height: 24, shape: 3 }
      ]
    },
    5: {
      title: "LEVEL 5: OLYMPUS MONS • APEX CALDERA",
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
        {
          type: 'sample',
          name: 'Summit Olivine Phenocryst',
          x: 1800,
          y: 1300,
          collected: false,
          info: 'Ultra-pure green forsteritic olivine formed under extreme pressure and preserved at 21.2 kilometers altitude, where atmospheric pressure is a near-vacuum 0.07 kPa.',
          chemicalFormula: 'Mg₂SiO₄ + Cr-Spinel',
          astroPotential: 'MODERATE - High-Altitude Cosmic Radiation Shielding Proxy',
          category: 'PLUTONIC FORSTERITE',
          density: '3.31 g/cm³'
        },
        { type: 'relay', name: 'Deep Space Quantum Uplink', x: 2600, y: 1500, visited: false },
        { type: 'settlement', name: 'Colony Habitat Dome Alpha', x: 2700, y: 2700, marked: false }
      ],
      rocks: [
        { x: 650, y: 550, radius: 28, height: 22, shape: 1 },
        { x: 720, y: 780, radius: 34, height: 26, shape: 2 },
        { x: 1100, y: 820, radius: 30, height: 24, shape: 3 },
        { x: 1250, y: 620, radius: 36, height: 28, shape: 4 },
        { x: 1400, y: 1100, radius: 32, height: 25, shape: 5 },
        { x: 1650, y: 1050, radius: 38, height: 30, shape: 1 },
        { x: 1650, y: 1550, radius: 35, height: 28, shape: 2 },
        { x: 1950, y: 1100, radius: 30, height: 24, shape: 3 },
        { x: 2050, y: 1450, radius: 36, height: 29, shape: 4 },
        { x: 2350, y: 1350, radius: 32, height: 25, shape: 5 },
        { x: 2450, y: 1650, radius: 34, height: 27, shape: 1 },
        { x: 2750, y: 1350, radius: 30, height: 24, shape: 2 },
        { x: 2800, y: 1700, radius: 37, height: 30, shape: 3 },
        { x: 2450, y: 2050, radius: 33, height: 26, shape: 4 },
        { x: 2250, y: 2350, radius: 35, height: 28, shape: 5 },
        { x: 2550, y: 2500, radius: 31, height: 25, shape: 1 },
        { x: 2850, y: 2550, radius: 36, height: 29, shape: 2 },
        { x: 2500, y: 2900, radius: 32, height: 26, shape: 3 },
        { x: 2850, y: 2900, radius: 38, height: 31, shape: 4 },
        { x: 1750, y: 2200, radius: 34, height: 27, shape: 5 }
      ]
    }
  };
}

export function getFreeRoamLevel(): LevelConfig {
  return {
    title: "FREE ROAM: MARS PLANETARY SURFACE",
    subtitle: "Open Planetary Exploration & Mineral Prospecting",
    mapWidth: 4400,
    mapHeight: 4400,
    startPos: { x: 2200, y: 2200 },
    bg: '#9E2A1B',
    biome: 'basalt',
    objectives: [
      { id: 'freeRoamSurvey', text: 'Free Roam Active: Prospect rare Martian minerals and explore open surface sectors!', done: false },
      { id: 'freeRoamSamples', text: 'Drill surface mineral nodes (E) to catalog rich specimens in your Science Log.', done: false }
    ],
    targets: [
      {
        type: 'sample',
        name: 'Hematite Spherule "Blueberry" Field',
        x: 1800,
        y: 1900,
        collected: false,
        info: 'Dense field of spherical gray hematite concretions weathered from sedimentary sulfate rock, proving persistent ancient aqueous groundwater flows.',
        chemicalFormula: 'Fe₂O₃ (Alpha Hematite)',
        astroPotential: 'HIGH - Aqueous Groundwater Flow & Mineralized Bio-Textures',
        category: 'AQUEOUS CONCRETION',
        density: '5.26 g/cm³'
      },
      {
        type: 'sample',
        name: 'Jarosite Hydrated Sulfate Deposit',
        x: 2500,
        y: 1800,
        collected: false,
        info: 'Yellow-brown hydrous iron sulfate evaporite mineral confirming past acidic lakes and hot springs in ancient Martian lowlands.',
        chemicalFormula: 'KFe³⁺₃(SO₄)₂(OH)₆',
        astroPotential: 'EXTREME - Habitable Acidic Micro-Niche & Hydrothermal Brine',
        category: 'EVAPORITE SULFATE',
        density: '3.15 g/cm³'
      },
      {
        type: 'sample',
        name: 'Subsurface Cryo-Glacial Ice Lens',
        x: 1400,
        y: 2600,
        collected: false,
        info: 'Pure basal cryosphere water ice buried beneath 0.3m regolith mantle. Estimated 98.4% water purity suitable for human life support and hydrogen fuel electrolysis.',
        chemicalFormula: 'H₂O(s) + Trace CO₂',
        astroPotential: 'EXTREME - Cryopreserved Ancient Micro-Biosignatures',
        category: 'PERMAFROST CRYO-ICE',
        density: '0.92 g/cm³'
      },
      {
        type: 'sample',
        name: 'Iron-Nickel Pallasite Meteorite Fragment',
        x: 2900,
        y: 2500,
        collected: false,
        info: 'Pristine iron-nickel meteorite fragment containing olivine crystals, preserved unaltered on the dry surface for millions of years.',
        chemicalFormula: 'Fe-Ni (Kamacite & Taenite)',
        astroPotential: 'MODERATE - Exogenous Delivery of Prebiotic Carbon & Phosphorus',
        category: 'METEORITIC PALLASITE',
        density: '7.85 g/cm³'
      },
      {
        type: 'sample',
        name: 'Smectite Phyllosilicate Clay Bed',
        x: 2200,
        y: 1400,
        collected: false,
        info: 'Fine-grained aluminosilicate clay formed through long-duration neutral water alteration of basalt, offering high organic molecular preservation.',
        chemicalFormula: '(Na,Ca)₀.₃₃(Al,Mg)₂(Si₄O₁₀)(OH)₂·nH₂O',
        astroPotential: 'CRITICAL - Prime Reservoir for Ancient Amino Acids & Organics',
        category: 'PHYLLOSILICATE CLAY',
        density: '2.35 g/cm³'
      },
      {
        type: 'sample',
        name: 'Hydrothermal Opaline Silica Sinter',
        x: 1500,
        y: 1600,
        collected: false,
        info: 'Hydrated amorphous silica deposited by geothermal geysers and hot springs, identical to fossil-bearing sinter beds in Iceland and Yellowstone.',
        chemicalFormula: 'SiO₂·nH₂O',
        astroPotential: 'MAXIMUM - Premier Target for Microbial Biosignature Discovery',
        category: 'HOT SPRING SINTER',
        density: '2.10 g/cm³'
      },
      {
        type: 'sample',
        name: 'Enargite Copper Sulfosalt Vein',
        x: 3100,
        y: 1600,
        collected: false,
        info: 'Metallic sulfosalt mineral deposited along volcanic tectonic fault lines, rich in copper and arsenic compounds.',
        chemicalFormula: 'Cu₃AsS₄',
        astroPotential: 'MODERATE - Inorganic Chemoautotrophic Electron Donor',
        category: 'TECTONIC SULFOSALT',
        density: '4.45 g/cm³'
      },
      {
        type: 'sample',
        name: 'Native Titanium Alloy Vein',
        x: 1700,
        y: 3100,
        collected: false,
        info: 'Ultra-dense ilmenite and titanomagnetite vein, critical for industrial colony manufacturing and lightweight aerospace rover shielding.',
        chemicalFormula: 'FeTiO₃ + Ti-Magnetite',
        astroPotential: 'LOW - High-Strength In-Situ Colony Resource (ISRU)',
        category: 'STRATEGIC RESOURCE ORE',
        density: '4.78 g/cm³'
      },
      {
        type: 'sample',
        name: 'Volcanic Obsidian Glass Nodule',
        x: 2600,
        y: 3200,
        collected: false,
        info: 'Rapidly cooled rhyolitic-basaltic natural volcanic glass formed during violent pyroclastic eruption events.',
        chemicalFormula: '70-75% SiO₂ + Fe,Mg Glass Matrix',
        astroPotential: 'MODERATE - Fluid Inclusion Micro-Cavities',
        category: 'VOLCANIC PYRO-GLASS',
        density: '2.55 g/cm³'
      },
      {
        type: 'sample',
        name: 'Gypsum Crystal Hydrated Crust',
        x: 3300,
        y: 3100,
        collected: false,
        info: 'Translucent calcium sulfate dihydrate crystals precipitated in evaporating playa lake brines during late Amazonian climate transitions.',
        chemicalFormula: 'CaSO₄·2H₂O',
        astroPotential: 'HIGH - Microbial Trapping in Intact Fluid Inclusions',
        category: 'EVAPORITE CRYSTAL',
        density: '2.31 g/cm³'
      },
      { type: 'station', name: 'Free Roam Planetary Workshop Nexus', x: 2200, y: 2200, minigame: 1, visited: false },
      { type: 'relay', name: 'Planetary Transceiver Antenna', x: 2400, y: 2400, visited: false }
    ],
    rocks: [
      { x: 1950, y: 2050, radius: 26, height: 20, shape: 1 },
      { x: 2150, y: 1950, radius: 30, height: 24, shape: 2 },
      { x: 2350, y: 2150, radius: 28, height: 22, shape: 3 },
      { x: 2050, y: 2350, radius: 32, height: 25, shape: 4 },
      { x: 1750, y: 1750, radius: 34, height: 26, shape: 5 },
      { x: 2700, y: 1650, radius: 30, height: 22, shape: 1 },
      { x: 1550, y: 2750, radius: 28, height: 21, shape: 2 },
      { x: 3000, y: 2700, radius: 35, height: 27, shape: 3 },
      { x: 1850, y: 3250, radius: 32, height: 25, shape: 4 },
      { x: 2800, y: 3350, radius: 33, height: 26, shape: 5 }
    ]
  };
}
