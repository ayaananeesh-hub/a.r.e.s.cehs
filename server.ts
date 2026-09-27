import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed default profiles if not present
function loadProfilesFromDisk(): any[] {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading profiles.json:', err);
  }
  return [];
}

function saveProfilesToDisk(profiles: any[]): void {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing profiles.json:', err);
  }
}

// In-memory cache synced with disk
let cachedProfiles: any[] = loadProfilesFromDisk();

// Helper to normalize IDs
function normalizeId(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

// API Routes

// 1. Get all profiles (returns list with passcodes omitted or flagged)
app.get('/api/profiles', (_req: Request, res: Response) => {
  const safeList = cachedProfiles.map((p) => {
    // Send public profile info, don't expose raw passcode
    const { passcode, ...safe } = p;
    return {
      ...safe,
      hasPasscode: Boolean(passcode && String(passcode).trim().length > 0),
    };
  });
  res.json({ success: true, profiles: safeList });
});

// 2. Register new profile
app.post('/api/profiles/register', (req: Request, res: Response) => {
  const { name, passcode, profileData } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ success: false, error: 'Call-sign must be at least 2 characters.' });
    return;
  }

  const cleanName = name.trim();
  const id = normalizeId(cleanName);

  if (id === 'a_r_e_s' || cleanName.toUpperCase() === 'A.R.E.S.') {
    res.status(400).json({ success: false, error: 'A.R.E.S. is a reserved system protocol.' });
    return;
  }

  // Check if already registered
  const existing = cachedProfiles.find((p) => p.id === id || p.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    res.status(409).json({
      success: false,
      error: `Commander call-sign "${cleanName}" is already registered. Please choose a different name or log in with your passcode.`,
    });
    return;
  }

  const cleanPasscode = typeof passcode === 'string' ? passcode.trim() : '';
  const newProfile = {
    ...(profileData || {}),
    id,
    name: cleanName,
    passcode: cleanPasscode, // stored securely on the server
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
  };

  cachedProfiles.unshift(newProfile);
  saveProfilesToDisk(cachedProfiles);

  const { passcode: _p, ...safeProfile } = newProfile;
  res.json({
    success: true,
    profile: { ...safeProfile, hasPasscode: Boolean(cleanPasscode) },
    message: 'Profile registered successfully.',
  });
});

// 3. Login returning profile with passcode
app.post('/api/profiles/login', (req: Request, res: Response) => {
  const { idOrName, passcode } = req.body;
  if (!idOrName) {
    res.status(400).json({ success: false, error: 'Identifier required.' });
    return;
  }

  const norm = normalizeId(String(idOrName));
  const rawClean = String(idOrName).trim().toLowerCase();

  // Special A.R.E.S. login check
  if (norm === 'a_r_e_s' || rawClean === 'a.r.e.s.' || rawClean === 'ares') {
    if (String(passcode).trim() === 'ayaanadrithmuflihcehs2026') {
      res.json({ success: true, verified: true, isAres: true });
      return;
    } else {
      res.status(401).json({ success: false, error: 'Invalid A.R.E.S. security clearance passcode.' });
      return;
    }
  }

  const profile = cachedProfiles.find(
    (p) => p.id === norm || (p.name && p.name.trim().toLowerCase() === rawClean)
  );

  if (!profile) {
    res.status(404).json({ success: false, error: `Commander "${idOrName}" not found.` });
    return;
  }

  // Check passcode if one was set
  const storedPasscode = profile.passcode ? String(profile.passcode).trim() : '';
  const inputPasscode = typeof passcode === 'string' ? passcode.trim() : '';

  if (storedPasscode.length > 0) {
    if (!inputPasscode || inputPasscode !== storedPasscode) {
      res.status(401).json({
        success: false,
        error: 'Incorrect passcode. Please check your credentials.',
      });
      return;
    }
  }

  profile.lastPlayedAt = new Date().toISOString();
  saveProfilesToDisk(cachedProfiles);

  const { passcode: _p, ...safeProfile } = profile;
  res.json({
    success: true,
    profile: { ...safeProfile, hasPasscode: Boolean(storedPasscode) },
  });
});

// 4. Save profile updates (points, rover, level, discoveries)
app.post('/api/profiles/save', (req: Request, res: Response) => {
  const { profile, passcode } = req.body;
  if (!profile || !profile.id) {
    res.status(400).json({ success: false, error: 'Invalid profile data.' });
    return;
  }

  const id = normalizeId(profile.id);
  const idx = cachedProfiles.findIndex((p) => p.id === id);

  if (idx >= 0) {
    const existing = cachedProfiles[idx];
    // Preserve existing passcode if not provided in update
    const finalPasscode =
      typeof passcode === 'string' && passcode.trim().length > 0
        ? passcode.trim()
        : existing.passcode || '';

    cachedProfiles[idx] = {
      ...existing,
      ...profile,
      passcode: finalPasscode,
      lastPlayedAt: new Date().toISOString(),
    };
  } else {
    // New profile save
    cachedProfiles.unshift({
      ...profile,
      passcode: typeof passcode === 'string' ? passcode.trim() : '',
      lastPlayedAt: new Date().toISOString(),
    });
  }

  saveProfilesToDisk(cachedProfiles);
  res.json({ success: true, message: 'Profile saved to server storage.' });
});

// 5. Delete profile
app.delete('/api/profiles/:id', (req: Request, res: Response) => {
  const id = normalizeId(req.params.id);
  if (id === 'a_r_e_s') {
    res.status(403).json({ success: false, error: 'A.R.E.S. cannot be deleted.' });
    return;
  }

  cachedProfiles = cachedProfiles.filter((p) => p.id !== id);
  saveProfilesToDisk(cachedProfiles);
  res.json({ success: true, message: 'Profile deleted.' });
});

// Vite or Static file serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mars Rover server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
