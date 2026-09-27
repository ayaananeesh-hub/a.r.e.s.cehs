// MARS TERRAIN & VEHICLE SUSPENSION DYNAMICS ENGINE
// Provides realistic 3D Martian terrain elevations with smooth craters and small bumps.
// Features advanced 6-wheel rocker-bogie multi-axis compliant suspension
// so the rover never clips, sinks into the ground, or floats.

export interface CraterDef {
  x: number;
  y: number;
  radius: number;
  depth: number;
  rimHeight?: number;
}

export interface RoverSuspensionSample {
  height: number; // World chassis elevation Y
  pitch: number;  // In radians (terrain slope + dynamic squat/dive)
  roll: number;   // In radians (terrain camber + dynamic cornering)
  bounce: number; // Vertical suspension micro-vibration
  wheelOffsets: {
    FL: number;
    ML: number;
    RL: number;
    FR: number;
    MR: number;
    RR: number;
  };
}

// Cache of deterministic craters per level to ensure stable terrain across frames
const levelCratersCache: Record<number, CraterDef[]> = {};

/**
 * Generates a deterministic, aesthetically pleasing set of Martian craters for a level.
 * Craters have clear bowl depressions and raised rims, avoiding the spawn zone and target structures.
 */
export function getLevelCraters(
  levelNum: number,
  biome: string = 'basalt',
  mapWidth: number = 2200,
  mapHeight: number = 2200,
  startPos?: { x: number; y: number },
  targets?: { x: number; y: number }[]
): CraterDef[] {
  if (levelCratersCache[levelNum]) {
    return levelCratersCache[levelNum];
  }

  const craters: CraterDef[] = [];
  const start = startPos || { x: 400, y: 400 };

  // Deterministic pseudo-random sequence based on level number
  let seed = levelNum * 9973 + 12345;
  const rnd = () => {
    seed = (seed * 16807 + 11) % 2147483647;
    return (seed & 0x7fffffff) / 2147483647;
  };

  const margin = 160;
  const numCraters = Math.floor(18 + rnd() * 8); // 18 to 26 craters

  for (let i = 0; i < numCraters * 3 && craters.length < numCraters; i++) {
    const cx = margin + rnd() * (mapWidth - margin * 2);
    const cy = margin + rnd() * (mapHeight - margin * 2);

    // Keep clear of initial spawn zone
    const dSpawn = Math.hypot(cx - start.x, cy - start.y);
    if (dSpawn < 180) continue;

    // Keep clear of target landmarks
    let hitsTarget = false;
    if (targets) {
      for (const t of targets) {
        if (Math.hypot(cx - t.x, cy - t.y) < 120) {
          hitsTarget = true;
          break;
        }
      }
    }
    if (hitsTarget) continue;

    // Avoid overlapping closely with existing craters
    let tooClose = false;
    for (const c of craters) {
      if (Math.hypot(cx - c.x, cy - c.y) < c.radius + 40) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // Scale crater proportions: radius 26 to 68, depth 1.8 to 4.2
    const isMedium = rnd() > 0.45;
    const radius = isMedium ? 42 + rnd() * 26 : 24 + rnd() * 16;
    const depth = isMedium ? 2.8 + rnd() * 1.4 : 1.6 + rnd() * 1.0;
    const rimHeight = depth * (0.32 + rnd() * 0.12);

    craters.push({
      x: cx,
      y: cy,
      radius,
      depth,
      rimHeight,
    });
  }

  levelCratersCache[levelNum] = craters;
  return craters;
}

/**
 * Returns the ground surface elevation at (x, y).
 * Combines gentle Martian undulations, craters with depression bowls and raised rims,
 * and natural boundary mountain slopes.
 */
export function getTerrainHeight(
  x: number,
  y: number,
  biome: string = 'basalt',
  startPos?: { x: number; y: number },
  mapWidth: number = 2200,
  mapHeight: number = 2200,
  craters?: CraterDef[]
): number {
  let elevation = 0;

  // 1. Mountain Boundary Ramps (rising naturally into perimeter mountain ridges)
  const distToEdge = Math.min(x, mapWidth - x, y, mapHeight - y);
  if (distToEdge < 85) {
    const rampFactor = (85 - distToEdge) / 85;
    elevation += rampFactor * rampFactor * 32.0; // Steep mountain footing
  }

  // 2. Smooth Spawn Flattening (guarantees landing capsule & start pad are completely flat)
  let flatWeight = 1.0;
  if (startPos) {
    const dSpawn = Math.hypot(x - startPos.x, y - startPos.y);
    if (dSpawn < 140) {
      flatWeight = Math.min(1.0, Math.max(0.0, (dSpawn - 35) / 105));
    }
  }

  // 3. Small Bumps & Rolling Martian Undulations (Subtle, non-jarring, stylized)
  if (flatWeight > 0.001) {
    let bumpAmp = 1.4;
    let waveScale = 1.0;

    if (biome === 'dunes') {
      bumpAmp = 1.8;
      // Rolling transverse dunes
      const duneWave = Math.sin(x * 0.02 + y * 0.008) * 1.2 + Math.cos(y * 0.025) * 0.6;
      elevation += duneWave * bumpAmp * flatWeight;
    } else if (biome === 'ice') {
      bumpAmp = 0.9; // Ice plains are smoother
      const iceWave = Math.sin(x * 0.015) * Math.cos(y * 0.015) * 0.9;
      elevation += iceWave * bumpAmp * flatWeight;
    } else {
      // Basalt / Volcanic / Lava / Summit
      const bump1 = Math.sin(x * 0.018) * Math.cos(y * 0.018) * 1.1;
      const bump2 = Math.sin((x + y) * 0.035) * 0.55;
      const bump3 = Math.cos(x * 0.009 - y * 0.011) * 0.8;
      elevation += (bump1 + bump2 + bump3) * (bumpAmp * 0.65) * flatWeight;
    }

    // 4. Crater Depressions & Raised Lips
    if (craters && craters.length > 0) {
      for (let i = 0; i < craters.length; i++) {
        const c = craters[i];
        const dist = Math.hypot(x - c.x, y - c.y);
        const r = c.radius;

        // Influence zone extends to 1.35 * radius for outer rim falloff
        if (dist < r * 1.35) {
          const rimH = c.rimHeight || c.depth * 0.35;
          let craterOffset = 0;

          if (dist < r) {
            // Inside crater bowl: dips down smoothly to -depth at center
            const u = dist / r; // 0 at center, 1 at inner rim
            const bowlDepth = -c.depth * (1 - u * u);

            // Raised rim peaks near u = 0.85 -> 1.0
            const rimEffect = Math.max(0, 1 - Math.abs(dist - r) / (r * 0.3)) * rimH;
            craterOffset = bowlDepth + rimEffect;
          } else {
            // Outside rim: smoothly descends back to ground level
            const outerFalloff = 1 - (dist - r) / (r * 0.35);
            craterOffset = outerFalloff * outerFalloff * rimH;
          }

          elevation += craterOffset * flatWeight;
        }
      }
    }
  }

  return elevation;
}

/**
 * Calculates physical suspension displacement, chassis pitch, roll, and
 * individual 6-wheel rocker-bogie articulators based on rover world position,
 * speed, acceleration, and steering.
 * 
 * Ensures wheels and chassis ALWAYS remain above the terrain and never sink!
 */
export function calculateRoverSuspension(
  roverX: number,
  roverY: number,
  roverAngle: number,
  speed: number,
  acceleration: number,
  steering: number, // -1 (left), +1 (right), 0 (straight)
  travelDistance: number,
  biome: string = 'basalt',
  startPos?: { x: number; y: number },
  mapWidth: number = 2200,
  mapHeight: number = 2200,
  craters?: CraterDef[]
): RoverSuspensionSample {
  const absSpeed = Math.abs(speed);
  const speedRatio = Math.min(1.0, absSpeed / 3.2);

  // 1. Dynamic Pitch & Roll (Inertial forces from acceleration, braking, and steering)
  let dynamicPitch = 0;
  if (acceleration > 0.02) {
    dynamicPitch = -Math.min(0.05, acceleration * 0.22); // Rear squat on acceleration
  } else if (acceleration < -0.02) {
    dynamicPitch = Math.min(0.06, Math.abs(acceleration) * 0.28); // Forward dive on braking
  }

  // Centrifugal lean outward in turns
  const dynamicRoll = -steering * speedRatio * 0.045;

  // Wheel contact patch offsets in local rover space (L = 14, W = 16.5)
  // Local: -Z is forward, +X is right, -X is left, +Z is rear
  const cosA = Math.cos(roverAngle);
  const sinA = Math.sin(roverAngle);

  // Helper to map local (lx, lz) to world coordinates (wx, wz)
  const toWorld = (lx: number, lz: number): [number, number] => {
    // When local -Z is forward (+cosA, +sinA) and +X is right (+sinA, -cosA):
    const wx = roverX - lz * cosA + lx * sinA;
    const wz = roverY - lz * sinA - lx * cosA;
    return [wx, wz];
  };

  // Sample ground heights under each of the 6 wheels
  const [flX, flZ] = toWorld(-16.5, -14); // Front Left
  const [frX, frZ] = toWorld(16.5, -14);  // Front Right
  const [mlX, mlZ] = toWorld(-16.5, 0);   // Mid Left
  const [mrX, mrZ] = toWorld(16.5, 0);    // Mid Right
  const [rlX, rlZ] = toWorld(-16.5, 14);  // Rear Left
  const [rrX, rrZ] = toWorld(16.5, 14);   // Rear Right

  const ghFL = getTerrainHeight(flX, flZ, biome, startPos, mapWidth, mapHeight, craters);
  const ghFR = getTerrainHeight(frX, frZ, biome, startPos, mapWidth, mapHeight, craters);
  const ghML = getTerrainHeight(mlX, mlZ, biome, startPos, mapWidth, mapHeight, craters);
  const ghMR = getTerrainHeight(mrX, mrZ, biome, startPos, mapWidth, mapHeight, craters);
  const ghRL = getTerrainHeight(rlX, rlZ, biome, startPos, mapWidth, mapHeight, craters);
  const ghRR = getTerrainHeight(rrX, rrZ, biome, startPos, mapWidth, mapHeight, craters);
  const ghCenter = getTerrainHeight(roverX, roverY, biome, startPos, mapWidth, mapHeight, craters);

  // 2. Terrain Slope Pitch & Roll
  const frontAvg = (ghFL + ghFR) * 0.5;
  const rearAvg = (ghRL + ghRR) * 0.5;
  const wheelbase = 28.0;
  // Climbing up slope: front is higher than rear -> positive pitch
  const terrainPitch = Math.atan2(frontAvg - rearAvg, wheelbase);

  const leftAvg = (ghFL + ghML + ghRL) / 3.0;
  const rightAvg = (ghFR + ghMR + ghRR) / 3.0;
  const trackWidth = 33.0;
  // Right side higher: rover tilts left -> roll
  const terrainRoll = Math.atan2(rightAvg - leftAvg, trackWidth);

  // Total blended pitch and roll (clamped to realistic rover tolerances)
  const totalPitch = THREE_clamp(terrainPitch + dynamicPitch, -0.45, 0.45);
  const totalRoll = THREE_clamp(terrainRoll + dynamicRoll, -0.45, 0.45);

  // 3. Regolith Micro-Suspension Chatter (Tire compliance over Martian crust)
  const chatter = absSpeed > 0.05
    ? (Math.sin(travelDistance * 1.8) * 0.10 + Math.cos(travelDistance * 3.4) * 0.05) * speedRatio
    : 0;

  // 4. Chassis Elevation Guarantee (NEVER sinking into the ground)
  const avgGround = (ghFL + ghFR + ghML + ghMR + ghRL + ghRR) / 6.0;
  const maxGround = Math.max(ghFL, ghFR, ghML, ghMR, ghRL, ghRR, ghCenter);

  // Chassis sits securely on the wheels, with belly clearance above any crest
  const chassisTargetY = Math.max(avgGround, maxGround - 1.0) + chatter;

  // 5. Individual 6-Wheel Rocker-Bogie Articulation
  // Each wheel dynamically articulates vertically to touch the ground terrain point
  const baseWheelRadius = 6.5;

  // Expected world Y of wheel contact if chassis were rigid:
  // FL is at lz = -14, lx = -16.5: tilt effect
  const calcOffset = (groundY: number, lx: number, lz: number): number => {
    const tiltY = -lz * Math.sin(totalPitch) + lx * Math.sin(totalRoll);
    const nominalWheelWorldY = chassisTargetY + tiltY;
    // Difference between actual ground surface and nominal position:
    const diff = groundY - nominalWheelWorldY;
    // Clamp wheel articulation so suspension linkages stay realistic
    return THREE_clamp(diff, -3.2, 4.5);
  };

  const flOffset = calcOffset(ghFL, -16.5, -14);
  const frOffset = calcOffset(ghFR, 16.5, -14);
  const mlOffset = calcOffset(ghML, -16.5, 0);
  const mrOffset = calcOffset(ghMR, 16.5, 0);
  const rlOffset = calcOffset(ghRL, -16.5, 14);
  const rrOffset = calcOffset(ghRR, 16.5, 14);

  return {
    height: chassisTargetY,
    pitch: totalPitch,
    roll: totalRoll,
    bounce: chatter,
    wheelOffsets: {
      FL: flOffset,
      FR: frOffset,
      ML: mlOffset,
      MR: mrOffset,
      RL: rlOffset,
      RR: rrOffset,
    },
  };
}

function THREE_clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
