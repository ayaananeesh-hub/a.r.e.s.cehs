import { CharacterProfile, DiscoveryItem, LevelConfig, RoverState } from '../types';
import { defaultRoverState, getInitialLevels } from '../data/gameData';

const PROFILES_STORAGE_KEY = 'mars_rover_characters_list_v2';
const ACTIVE_PROFILE_KEY = 'mars_rover_active_character_id_v2';

export function normalizeProfileId(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export const ARES_PASSWORD = 'ayaanadrithmuflihcehs2026';
export const ARES_PROFILE_ID = 'a_r_e_s';

export function isAresProfile(idOrName?: string | null): boolean {
  if (!idOrName) return false;
  const n = normalizeProfileId(idOrName);
  return n === 'a_r_e_s' || idOrName.trim().toUpperCase() === 'A.R.E.S.' || idOrName.trim().toLowerCase() === 'ares';
}

export function verifyAresPassword(input: string): boolean {
  return input.trim() === ARES_PASSWORD;
}

export interface RoverTierInfo {
  tierName: string;
  tierLevel: number;
  bonusSpeed: number; // Velocity multiplier bonus e.g. 0.4
  bonusMaxHealth: number; // e.g. +30 HP
  bonusSolarEff: number; // e.g. +20%
  bonusBattery: number; // e.g. +30%
  color: string;
  badge: string;
  perks: string[];
}

/**
 * Calculates dynamic Rover stats and Evolution Tier based on total points spent/invested.
 * Includes 3 new high-ranking honorific titles!
 */
export function getTierForPointsSpent(pointsSpent: number = 0): RoverTierInfo {
  if (pointsSpent >= 4000) {
    return {
      tierName: 'MARTIAN SOVEREIGN ARCHITECT MK-VIII',
      tierLevel: 8,
      bonusSpeed: 1.10,
      bonusMaxHealth: 100,
      bonusSolarEff: 50,
      bonusBattery: 80,
      color: '#FF0055',
      badge: '🌌 SOVEREIGN ARCHITECT',
      perks: ['+45% Supercruise Velocity', '+100 Nanocarbon Armor HP', '+50% Solar Fusion Overdrive', '+80 Subatomic Battery Storage', 'Omni-Thermal Magma Tolerance'],
    };
  }
  if (pointsSpent >= 2600) {
    return {
      tierName: 'INTERPLANETARY FLEET ADMIRAL MK-VII',
      tierLevel: 7,
      bonusSpeed: 0.90,
      bonusMaxHealth: 80,
      bonusSolarEff: 40,
      bonusBattery: 60,
      color: '#FFD700',
      badge: '🎖️ FLEET ADMIRAL',
      perks: ['+35% Warp Velocity', '+80 Reinforced Plating HP', '+40% Solar Overdrive', '+60 Quantum Battery Cell', 'Extreme Hazard Tolerance'],
    };
  }
  if (pointsSpent >= 1800) {
    return {
      tierName: 'COSMIC MARS PIONEER MK-VI',
      tierLevel: 6,
      bonusSpeed: 0.75,
      bonusMaxHealth: 65,
      bonusSolarEff: 35,
      bonusBattery: 50,
      color: '#00E5FF',
      badge: '🌟 COSMIC PIONEER',
      perks: ['+30% Max Velocity', '+65 Titanium Hull HP', '+35% Solar Efficiency', '+50 Battery Storage', 'Cryo-Thermal Resistance'],
    };
  }
  if (pointsSpent >= 1200) {
    return {
      tierName: 'APEX COMMANDER MK-V',
      tierLevel: 5,
      bonusSpeed: 0.65,
      bonusMaxHealth: 50,
      bonusSolarEff: 30,
      bonusBattery: 40,
      color: '#E040FB',
      badge: '👑 APEX ELITE',
      perks: ['+25% Max Velocity', '+50 Armor Hull HP', '+30% Solar Overdrive', '+40 Battery Storage', 'Thermal Magma Tolerance'],
    };
  }
  if (pointsSpent >= 600) {
    return {
      tierName: 'ARES VETERAN MK-IV',
      tierLevel: 4,
      bonusSpeed: 0.45,
      bonusMaxHealth: 35,
      bonusSolarEff: 20,
      bonusBattery: 30,
      color: '#FF9800',
      badge: '⚡ ARES VETERAN',
      perks: ['+18% Max Velocity', '+35 Armor Hull HP', '+20% Solar Efficiency', '+30 Battery Storage'],
    };
  }
  if (pointsSpent >= 300) {
    return {
      tierName: 'EXPEDITION SPECIALIST MK-III',
      tierLevel: 3,
      bonusSpeed: 0.28,
      bonusMaxHealth: 20,
      bonusSolarEff: 15,
      bonusBattery: 20,
      color: '#4DD0E1',
      badge: '🔷 SPECIALIST',
      perks: ['+12% Max Velocity', '+20 Armor Hull HP', '+15% Solar Absorption', '+20 Battery Storage'],
    };
  }
  if (pointsSpent >= 100) {
    return {
      tierName: 'REINFORCED SCOUT MK-II',
      tierLevel: 2,
      bonusSpeed: 0.15,
      bonusMaxHealth: 10,
      bonusSolarEff: 10,
      bonusBattery: 10,
      color: '#2ECC71',
      badge: '🟩 REINFORCED',
      perks: ['+6% Max Velocity', '+10 Armor Hull HP', '+10% Solar Absorption'],
    };
  }
  return {
    tierName: 'CADET RECON MK-I',
    tierLevel: 1,
    bonusSpeed: 0,
    bonusMaxHealth: 0,
    bonusSolarEff: 0,
    bonusBattery: 0,
    color: '#90A4AE',
    badge: '⚪ CADET RECON',
    perks: ['Factory Standard Ares Chassis'],
  };
}

export function createAresProfile(): CharacterProfile {
  return {
    id: ARES_PROFILE_ID,
    name: 'A.R.E.S.',
    titleHonorific: 'MARTIAN QUANTUM CORE PROTOCOL',
    coins: 99999,
    pointsSpent: 9999,
    totalPointsEarned: 99999,
    currentLevelNum: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastPlayedAt: new Date().toISOString(),
    rover: {
      ...defaultRoverState,
      dust: 0,
      coins: 99999,
      pointsSpent: 9999,
      totalPointsEarned: 99999,
      sciencePoints: 9999,
      tunedSpeedLevel: 5,
      tunedArmorLevel: 5,
      tunedBatteryLevel: 5,
      tunedSolarLevel: 5,
      headlightsOn: true,
      customization: {
        skin: 'gold',
        wheel: 'plasma',
        light: 'cyan',
        trail: 'cyber',
      },
      unlockedSkins: ['classic', 'cyber', 'gold', 'stealth', 'emerald', 'hyperion', 'aurora', 'frostbite'],
      unlockedWheels: ['standard', 'spikes', 'plasma'],
      unlockedLights: ['cyan', 'amber', 'crimson', 'violet'],
      unlockedTrails: ['none', 'dust', 'cyber'],
    },
    discoveries: [],
    levels: getInitialLevels(),
  };
}

export function getAllProfiles(): CharacterProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    let parsed: any[] = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
    }
    if (!Array.isArray(parsed)) parsed = [];

    // Ensure A.R.E.S. is permanently seeded and cannot be removed
    const hasAres = parsed.some((p) => isAresProfile(p?.id) || isAresProfile(p?.name));
    if (!hasAres) {
      parsed.unshift(createAresProfile());
    }

    return parsed.map((p) => {
      const isAres = isAresProfile(p.id) || isAresProfile(p.name);
      const rover = p.rover || {};
      const coins = isAres ? 99999 : (typeof p.coins === 'number' ? p.coins : (rover.coins ?? rover.dust ?? 0));
      const pointsSpent = isAres ? 9999 : (typeof p.pointsSpent === 'number' ? p.pointsSpent : (rover.pointsSpent ?? 0));
      const totalPointsEarned = isAres ? 99999 : (
        typeof p.totalPointsEarned === 'number'
          ? p.totalPointsEarned
          : (rover.totalPointsEarned ?? (coins + pointsSpent))
      );

      return {
        ...p,
        id: isAres ? ARES_PROFILE_ID : p.id,
        name: isAres ? 'A.R.E.S.' : p.name,
        coins,
        pointsSpent,
        totalPointsEarned,
        rover: {
          ...defaultRoverState,
          ...rover,
          coins,
          pointsSpent,
          totalPointsEarned,
          sciencePoints: isAres ? 9999 : (rover.sciencePoints || 100),
          unlockedSkins: isAres
            ? ['classic', 'cyber', 'gold', 'stealth', 'emerald', 'hyperion', 'aurora', 'frostbite']
            : (Array.isArray(rover.unlockedSkins) && rover.unlockedSkins.length > 0 ? rover.unlockedSkins : ['classic']),
          unlockedWheels: isAres
            ? ['standard', 'spikes', 'plasma']
            : (Array.isArray(rover.unlockedWheels) && rover.unlockedWheels.length > 0 ? rover.unlockedWheels : ['standard']),
          unlockedLights: isAres
            ? ['cyan', 'amber', 'crimson', 'violet']
            : (Array.isArray(rover.unlockedLights) && rover.unlockedLights.length > 0 ? rover.unlockedLights : ['cyan']),
          unlockedTrails: isAres
            ? ['none', 'dust', 'cyber']
            : (Array.isArray(rover.unlockedTrails) && rover.unlockedTrails.length > 0 ? rover.unlockedTrails : ['none', 'dust']),
          customization: rover.customization || {
            skin: isAres ? 'gold' : 'classic',
            wheel: isAres ? 'plasma' : 'standard',
            light: 'cyan',
            trail: isAres ? 'cyber' : 'dust',
          },
        },
      };
    });
  } catch (err) {
    console.warn('Failed to load character profiles:', err);
    return [createAresProfile()];
  }
}

export function getProfile(idOrName: string): CharacterProfile | null {
  const normId = normalizeProfileId(idOrName);
  const profiles = getAllProfiles();
  return (
    profiles.find((p) => p.id === normId || p.name.trim().toLowerCase() === idOrName.trim().toLowerCase()) || null
  );
}

export function isNameRegistered(rawName: string): boolean {
  const normId = normalizeProfileId(rawName);
  if (!normId) return false;
  const profiles = getAllProfiles();
  return profiles.some(
    (p) => p.id === normId || p.name.trim().toLowerCase() === rawName.trim().toLowerCase()
  );
}

export function getActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function setActiveProfileId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function syncProfilesWithServer(): Promise<CharacterProfile[]> {
  try {
    const res = await fetch('/api/profiles');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.profiles)) {
        // Merge with local storage
        const local = getAllProfiles();
        const serverProfiles = data.profiles;
        const mergedMap = new Map<string, CharacterProfile>();

        // Server profiles have authority
        serverProfiles.forEach((sp: any) => {
          if (sp && sp.id) {
            mergedMap.set(sp.id, sp);
          }
        });

        // Add any local-only profiles
        local.forEach((lp) => {
          if (!mergedMap.has(lp.id)) {
            mergedMap.set(lp.id, lp);
            // push to server
            fetch('/api/profiles/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile: lp, passcode: lp.passcode }),
            }).catch(() => {});
          }
        });

        const merged = Array.from(mergedMap.values());
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    // Offline or network error - continue using local storage
    console.warn('Server profiles sync offline:', err);
  }
  return getAllProfiles();
}

export function saveProfile(profile: CharacterProfile): void {
  try {
    const profiles = getAllProfiles();
    const existingIdx = profiles.findIndex((p) => p.id === profile.id);
    const existing = existingIdx >= 0 ? profiles[existingIdx] : undefined;
    const existingRover = existing?.rover;
    const currentRover = profile.rover || existingRover || defaultRoverState;

    const updatedCoins =
      typeof profile.coins === 'number' ? profile.coins : (currentRover.coins ?? currentRover.dust ?? 0);
    const updatedSpent =
      typeof profile.pointsSpent === 'number' ? profile.pointsSpent : (currentRover.pointsSpent ?? 0);
    const updatedEarned =
      typeof profile.totalPointsEarned === 'number'
        ? profile.totalPointsEarned
        : updatedCoins + updatedSpent;

    const unlockedSkins = Array.isArray(currentRover.unlockedSkins) && currentRover.unlockedSkins.length > 0
      ? currentRover.unlockedSkins
      : (existingRover?.unlockedSkins || ['classic']);

    const unlockedWheels = Array.isArray(currentRover.unlockedWheels) && currentRover.unlockedWheels.length > 0
      ? currentRover.unlockedWheels
      : (existingRover?.unlockedWheels || ['standard']);

    const unlockedLights = Array.isArray(currentRover.unlockedLights) && currentRover.unlockedLights.length > 0
      ? currentRover.unlockedLights
      : (existingRover?.unlockedLights || ['cyan']);

    const unlockedTrails = Array.isArray(currentRover.unlockedTrails) && currentRover.unlockedTrails.length > 0
      ? currentRover.unlockedTrails
      : (existingRover?.unlockedTrails || ['none', 'dust']);

    const customization = currentRover.customization || existingRover?.customization || {
      skin: 'classic',
      wheel: 'standard',
      light: 'cyan',
      trail: 'dust',
    };

    const finalPasscode = profile.passcode || existing?.passcode || '';

    const updatedProfile: CharacterProfile = {
      ...profile,
      passcode: finalPasscode,
      hasPasscode: Boolean(finalPasscode && finalPasscode.length > 0),
      coins: updatedCoins,
      pointsSpent: updatedSpent,
      totalPointsEarned: updatedEarned,
      lastPlayedAt: new Date().toISOString(),
      rover: {
        ...currentRover,
        coins: updatedCoins,
        pointsSpent: updatedSpent,
        totalPointsEarned: updatedEarned,
        unlockedSkins,
        unlockedWheels,
        unlockedLights,
        unlockedTrails,
        customization,
      },
    };

    if (existingIdx >= 0) {
      profiles[existingIdx] = updatedProfile;
    } else {
      profiles.unshift(updatedProfile);
    }

    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    setActiveProfileId(profile.id);

    // Sync to backend server
    fetch('/api/profiles/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: updatedProfile, passcode: finalPasscode }),
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save character profile:', err);
  }
}

/**
 * Registers a brand NEW pilot with a secure passcode.
 * Explicitly rejects if the name is already registered!
 */
export function registerNewProfile(rawName: string, passcode?: string): {
  success: boolean;
  profile?: CharacterProfile;
  error?: string;
} {
  const cleanName = rawName.trim();
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Please enter a commander call-sign (at least 2 letters).' };
  }

  if (isAresProfile(cleanName)) {
    return {
      success: false,
      error: 'A.R.E.S. is an immutable system protocol. Please switch to RETURNING PLAYER and enter the security password.',
    };
  }

  if (isNameRegistered(cleanName)) {
    return {
      success: false,
      error: `Commander call-sign "${cleanName}" is already registered! Please choose a new unique name, or select RETURNING PLAYER to log in.`,
    };
  }

  const id = normalizeProfileId(cleanName);
  const initialRover: RoverState = {
    ...defaultRoverState,
    dust: 0,
    coins: 0,
    pointsSpent: 0,
    totalPointsEarned: 100,
    tunedSpeedLevel: 0,
    tunedArmorLevel: 0,
    tunedBatteryLevel: 0,
    tunedSolarLevel: 0,
    headlightsOn: true,
    sciencePoints: 100,
    health: 100,
    maxHealth: 100,
  };

  const cleanPasscode = typeof passcode === 'string' ? passcode.trim() : '';

  const newProfile: CharacterProfile = {
    id,
    name: cleanName,
    passcode: cleanPasscode,
    hasPasscode: Boolean(cleanPasscode.length > 0),
    coins: 0,
    pointsSpent: 0,
    totalPointsEarned: 100,
    currentLevelNum: 1,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    rover: initialRover,
    discoveries: [],
    levels: getInitialLevels(),
  };

  saveProfile(newProfile);
  setActiveProfileId(id);

  // Sync with server
  fetch('/api/profiles/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: cleanName, passcode: cleanPasscode, profileData: newProfile }),
  }).catch(() => {});

  return { success: true, profile: newProfile };
}

/**
 * Logs in a RETURNING pilot, verifying passcode if set.
 */
export function loginReturningProfile(rawNameOrId: string, passcode?: string): {
  success: boolean;
  profile?: CharacterProfile;
  error?: string;
  requiresPasscode?: boolean;
} {
  const clean = rawNameOrId.trim();
  const id = normalizeProfileId(clean);

  if (isAresProfile(id) || isAresProfile(clean)) {
    if (passcode && verifyAresPassword(passcode)) {
      const aresProfile = getProfile(ARES_PROFILE_ID) || createAresProfile();
      setActiveProfileId(aresProfile.id);
      return { success: true, profile: aresProfile };
    } else {
      return {
        success: false,
        requiresPasscode: true,
        error: 'ACCESS DENIED: Invalid A.R.E.S. Security Clearance Password.',
      };
    }
  }

  const existing =
    getProfile(id) || getAllProfiles().find((p) => p.name.toLowerCase() === clean.toLowerCase());

  if (!existing) {
    return {
      success: false,
      error: `Commander "${clean}" was not found in Ares Base registry. Please check your spelling or choose NEW PLAYER.`,
    };
  }

  // If profile has a passcode, verify it
  const storedPasscode = existing.passcode ? String(existing.passcode).trim() : '';
  const inputPasscode = typeof passcode === 'string' ? passcode.trim() : '';

  if (storedPasscode.length > 0) {
    if (!inputPasscode) {
      return {
        success: false,
        requiresPasscode: true,
        error: `Please enter the passcode for Commander "${existing.name}".`,
      };
    }
    if (inputPasscode !== storedPasscode) {
      return {
        success: false,
        requiresPasscode: true,
        error: 'ACCESS DENIED: Incorrect security passcode. Please check your credentials.',
      };
    }
  }

  const coins = existing.coins ?? existing.rover?.coins ?? existing.rover?.dust ?? 0;
  const pointsSpent = existing.pointsSpent ?? existing.rover?.pointsSpent ?? 0;
  const totalPointsEarned = existing.totalPointsEarned ?? coins + pointsSpent;

  const updated: CharacterProfile = {
    ...existing,
    coins,
    pointsSpent,
    totalPointsEarned,
    lastPlayedAt: new Date().toISOString(),
    rover: {
      ...existing.rover,
      coins,
      pointsSpent,
      totalPointsEarned,
    },
  };

  saveProfile(updated);
  setActiveProfileId(updated.id);

  // Sync login with server
  fetch('/api/profiles/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idOrName: clean, passcode: inputPasscode }),
  }).catch(() => {});

  return { success: true, profile: updated };
}

/**
 * Logs in existing character or creates a brand new one (legacy fallback).
 */
export function loginOrRegisterProfile(
  rawName: string
): { profile: CharacterProfile; isNew: boolean } {
  const cleanName = rawName.trim();
  const id = normalizeProfileId(cleanName);

  const existing = getProfile(id);
  if (existing) {
    const res = loginReturningProfile(cleanName);
    return { profile: res.profile || existing, isNew: false };
  }

  const res = registerNewProfile(cleanName);
  if (res.profile) {
    return { profile: res.profile, isNew: true };
  }

  // Fallback if somehow registered during race
  const fallback = getProfile(id)!;
  return { profile: fallback, isNew: false };
}

/**
 * Resets a character's mission progress back to Day 1 (0 coins, Level 1, default rover),
 * while keeping their registered name in the database.
 */
export function resetCharacterProfile(idOrName: string): CharacterProfile {
  const id = normalizeProfileId(idOrName);
  if (isAresProfile(id)) {
    // A.R.E.S. profile cannot be reset
    return getProfile(id) || createAresProfile();
  }
  const existing = getProfile(id);
  const displayName = existing ? existing.name : idOrName.trim();

  const resetState: CharacterProfile = {
    id,
    name: displayName,
    coins: 0,
    pointsSpent: 0,
    totalPointsEarned: 100,
    currentLevelNum: 1,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    rover: {
      ...defaultRoverState,
      dust: 0,
      coins: 0,
      pointsSpent: 0,
      totalPointsEarned: 100,
      tunedSpeedLevel: 0,
      tunedArmorLevel: 0,
      tunedBatteryLevel: 0,
      tunedSolarLevel: 0,
      headlightsOn: true,
      sciencePoints: 100,
    },
    discoveries: [],
    levels: getInitialLevels(),
  };

  saveProfile(resetState);
  return resetState;
}

export function deleteProfile(idOrName: string): void {
  const id = normalizeProfileId(idOrName);
  if (isAresProfile(id)) {
    console.warn('A.R.E.S. is an immutable core system protocol and cannot be deleted.');
    return;
  }
  try {
    const profiles = getAllProfiles().filter((p) => p.id !== id);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    if (getActiveProfileId() === id) {
      const fallback = profiles[0]?.id || null;
      setActiveProfileId(fallback);
    }
  } catch (err) {
    console.error('Failed to delete profile:', err);
  }
}
