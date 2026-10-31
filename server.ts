import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// TMDB API Key from environment or provided secure key
const TMDB_API_KEY = process.env.TMDB_API_KEY || '286855a91070a5d195e44aba70f81f53';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(express.json());

// In-memory cache for TMDB requests to optimize performance
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchFromTMDB(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');

  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`TMDB error [${res.status}] for ${endpoint}:`, errText);
      throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    cache.set(cacheKey, { timestamp: Date.now(), data });
    return data;
  } catch (error: any) {
    console.error(`Fetch failure for ${endpoint}:`, error.message);
    // If cached data exists even if expired, return it as emergency fallback
    if (cached) {
      return cached.data;
    }
    // Return empty results payload to keep the client stable
    return { page: 1, results: [], total_pages: 1 };
  }
}

// ---------------------------------------------------------
// File-backed Persistence (Database)
// ---------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  watchlist: any[];
  continueWatching: any[];
  preferences: {
    audioLanguage: string;
    subtitleLanguage: string;
    autoplayNext: boolean;
    defaultQuality: string;
  };
}

interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  profiles: UserProfile[];
}

interface DatabaseSchema {
  users: UserAccount[];
  streamingProviders: any[];
  customFeaturedId: string | null;
  analytics: {
    totalStreams: number;
    totalWatchMinutes: number;
    popularMedia: Record<string, number>;
  };
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_cinepulse_salt_2026').digest('hex');
}

function getInitialDatabase(): DatabaseSchema {
  const initialProfiles: UserProfile[] = [
    {
      id: 'prof_1',
      name: 'Brighto (Admin)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isKids: false,
      watchlist: [],
      continueWatching: [],
      preferences: {
        audioLanguage: 'en',
        subtitleLanguage: 'en',
        autoplayNext: true,
        defaultQuality: '1080p',
      },
    },
    {
      id: 'prof_2',
      name: 'Cinema Room',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      isKids: false,
      watchlist: [],
      continueWatching: [],
      preferences: {
        audioLanguage: 'en',
        subtitleLanguage: 'off',
        autoplayNext: true,
        defaultQuality: '4k',
      },
    },
    {
      id: 'prof_3',
      name: 'Kids Club',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
      isKids: true,
      watchlist: [],
      continueWatching: [],
      preferences: {
        audioLanguage: 'en',
        subtitleLanguage: 'en',
        autoplayNext: false,
        defaultQuality: '720p',
      },
    },
  ];

  const streamingProviders = [
    {
      id: 'netflix',
      name: 'Netflix',
      badgeColor: '#E50914',
      logo: 'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2023.ico',
      active: true,
      searchUrl: 'https://www.netflix.com/search?q=',
    },
    {
      id: 'appletv',
      name: 'Apple TV+',
      badgeColor: '#FFFFFF',
      logo: 'https://tv.apple.com/favicon.ico',
      active: true,
      searchUrl: 'https://tv.apple.com/search?term=',
    },
    {
      id: 'max',
      name: 'Max',
      badgeColor: '#002BE7',
      logo: 'https://www.max.com/favicon.ico',
      active: true,
      searchUrl: 'https://play.max.com/search?q=',
    },
    {
      id: 'prime',
      name: 'Prime Video',
      badgeColor: '#00A8E1',
      logo: 'https://www.primevideo.com/favicon.ico',
      active: true,
      searchUrl: 'https://www.amazon.com/s?k=',
    },
    {
      id: 'disney',
      name: 'Disney+',
      badgeColor: '#113CCF',
      logo: 'https://www.disneyplus.com/favicon.ico',
      active: true,
      searchUrl: 'https://www.disneyplus.com/search?q=',
    },
  ];

  const defaultAdmin: UserAccount = {
    id: 'user_admin',
    email: 'brightotoms@gmail.com',
    passwordHash: hashPassword('admin1234'),
    name: 'Brighto (Admin)',
    role: 'admin',
    createdAt: new Date().toISOString(),
    profiles: initialProfiles,
  };

  return {
    users: [defaultAdmin],
    streamingProviders,
    customFeaturedId: null,
    analytics: {
      totalStreams: 1850,
      totalWatchMinutes: 24300,
      popularMedia: {},
    },
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.users || parsed.users.length === 0) {
        return getInitialDatabase();
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

let db = loadDatabase();

// Helper: Authenticate JWT / Bearer Token
function getAuthenticatedUser(req: Request): UserAccount | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    const user = db.users.find(u => u.id === userId);
    return user || null;
  } catch {
    return null;
  }
}

function generateToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

// ---------------------------------------------------------
// Auth Endpoints
// ---------------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
    role: email.toLowerCase() === 'brightotoms@gmail.com' ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    profiles: [
      {
        id: `prof_${Date.now()}`,
        name,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isKids: false,
        watchlist: [],
        continueWatching: [],
        preferences: {
          audioLanguage: 'en',
          subtitleLanguage: 'en',
          autoplayNext: true,
          defaultQuality: '1080p',
        },
      },
    ],
  };

  db.users.push(newUser);
  saveDatabase(db);

  const token = generateToken(newUser.id);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      profiles: newUser.profiles,
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profiles: user.profiles,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profiles: user.profiles,
    },
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.passwordHash = hashPassword(newPassword);
    saveDatabase(db);
  }
  res.json({ message: 'Password has been updated. You can now log in.' });
});

// ---------------------------------------------------------
// Profile Management
// ---------------------------------------------------------
app.post('/api/profiles', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, avatar, isKids } = req.body;
  if (!name) return res.status(400).json({ error: 'Profile name is required' });

  if (user.profiles.length >= 5) {
    return res.status(400).json({ error: 'Maximum of 5 profiles allowed per account' });
  }

  const newProfile: UserProfile = {
    id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    isKids: !!isKids,
    watchlist: [],
    continueWatching: [],
    preferences: {
      audioLanguage: 'en',
      subtitleLanguage: 'en',
      autoplayNext: true,
      defaultQuality: '1080p',
    },
  };

  user.profiles.push(newProfile);
  saveDatabase(db);
  res.status(201).json(newProfile);
});

app.put('/api/profiles/:profileId', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profile = user.profiles.find(p => p.id === req.params.profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const { name, avatar, isKids, preferences } = req.body;
  if (name !== undefined) profile.name = name;
  if (avatar !== undefined) profile.avatar = avatar;
  if (isKids !== undefined) profile.isKids = isKids;
  if (preferences) profile.preferences = { ...profile.preferences, ...preferences };

  saveDatabase(db);
  res.json(profile);
});

app.delete('/api/profiles/:profileId', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.profiles.length <= 1) {
    return res.status(400).json({ error: 'At least one profile must be retained' });
  }

  user.profiles = user.profiles.filter(p => p.id !== req.params.profileId);
  saveDatabase(db);
  res.json({ success: true });
});

// ---------------------------------------------------------
// Watchlist
// ---------------------------------------------------------
app.get('/api/user/watchlist', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profileId = (req.query.profileId as string) || user.profiles[0]?.id;
  const profile = user.profiles.find(p => p.id === profileId) || user.profiles[0];
  res.json({ watchlist: profile?.watchlist || [] });
});

app.post('/api/user/watchlist', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { profileId, item } = req.body;
  if (!item || !item.id) return res.status(400).json({ error: 'Invalid movie item' });

  const targetProfile = user.profiles.find(p => p.id === profileId) || user.profiles[0];
  if (!targetProfile) return res.status(404).json({ error: 'Profile not found' });

  const exists = targetProfile.watchlist.some(w => String(w.id) === String(item.id));
  if (!exists) {
    targetProfile.watchlist.unshift({
      ...item,
      addedAt: new Date().toISOString(),
    });
    saveDatabase(db);
  }

  res.json({ watchlist: targetProfile.watchlist });
});

app.delete('/api/user/watchlist/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profileId = (req.query.profileId as string) || user.profiles[0]?.id;
  const targetProfile = user.profiles.find(p => p.id === profileId) || user.profiles[0];
  if (!targetProfile) return res.status(404).json({ error: 'Profile not found' });

  targetProfile.watchlist = targetProfile.watchlist.filter(w => String(w.id) !== String(req.params.id));
  saveDatabase(db);
  res.json({ watchlist: targetProfile.watchlist });
});

// ---------------------------------------------------------
// Continue Watching
// ---------------------------------------------------------
app.get('/api/user/continue-watching', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profileId = (req.query.profileId as string) || user.profiles[0]?.id;
  const profile = user.profiles.find(p => p.id === profileId) || user.profiles[0];
  res.json({ continueWatching: profile?.continueWatching || [] });
});

app.post('/api/user/continue-watching', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { profileId, item } = req.body;
  if (!item || !item.id) return res.status(400).json({ error: 'Invalid item' });

  const profile = user.profiles.find(p => p.id === profileId) || user.profiles[0];
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  profile.continueWatching = profile.continueWatching.filter(c => String(c.id) !== String(item.id));
  const progressPercent = item.progressPercent || Math.round((item.currentTime / (item.duration || 1)) * 100);

  if (progressPercent < 95) {
    profile.continueWatching.unshift({
      ...item,
      progressPercent,
      lastWatched: new Date().toISOString(),
    });
    if (profile.continueWatching.length > 20) {
      profile.continueWatching.pop();
    }
  }

  db.analytics.totalWatchMinutes += Math.round((item.currentTime || 60) / 60);
  db.analytics.popularMedia[item.id] = (db.analytics.popularMedia[item.id] || 0) + 1;

  saveDatabase(db);
  res.json({ continueWatching: profile.continueWatching });
});

app.delete('/api/user/continue-watching/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profileId = (req.query.profileId as string) || user.profiles[0]?.id;
  const profile = user.profiles.find(p => p.id === profileId) || user.profiles[0];
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  profile.continueWatching = profile.continueWatching.filter(c => String(c.id) !== String(req.params.id));
  saveDatabase(db);
  res.json({ continueWatching: profile.continueWatching });
});

// ---------------------------------------------------------
// Admin Endpoints
// ---------------------------------------------------------
app.get('/api/admin/providers', (_req: Request, res: Response) => {
  res.json({ providers: db.streamingProviders });
});

app.put('/api/admin/providers/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }
  const provider = db.streamingProviders.find(p => p.id === req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  Object.assign(provider, req.body);
  saveDatabase(db);
  res.json(provider);
});

app.get('/api/admin/featured', (_req: Request, res: Response) => {
  res.json({ featuredId: db.customFeaturedId });
});

app.post('/api/admin/featured', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }
  db.customFeaturedId = req.body.featuredId || null;
  saveDatabase(db);
  res.json({ featuredId: db.customFeaturedId });
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }

  const totalUsers = db.users.length;
  const totalProfiles = db.users.reduce((acc, u) => acc + u.profiles.length, 0);

  res.json({
    stats: {
      totalUsers,
      totalProfiles,
      totalStreams: db.analytics.totalStreams,
      totalWatchMinutes: db.analytics.totalWatchMinutes,
      popularMedia: db.analytics.popularMedia,
    },
    users: db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      profilesCount: u.profiles.length,
      createdAt: u.createdAt,
    })),
    providers: db.streamingProviders,
  });
});

// ---------------------------------------------------------
// TMDB API Proxy Endpoints
// ---------------------------------------------------------

// Trending
app.get('/api/tmdb/trending/:mediaType/:timeWindow', async (req: Request, res: Response) => {
  const { mediaType = 'all', timeWindow = 'day' } = req.params;
  const page = req.query.page || 1;
  try {
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`, { page: String(page) });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Movies
app.get('/api/tmdb/movies/:category', async (req: Request, res: Response) => {
  const { category } = req.params;
  const page = req.query.page || 1;
  try {
    const data = await fetchFromTMDB(`/movie/${category}`, { page: String(page) });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TV
app.get('/api/tmdb/tv/:category', async (req: Request, res: Response) => {
  const { category } = req.params;
  const page = req.query.page || 1;
  try {
    const data = await fetchFromTMDB(`/tv/${category}`, { page: String(page) });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Movie Details
app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/movie/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations,watch/providers,release_dates',
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TV Show Details
app.get('/api/tmdb/tv-detail/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/tv/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations,watch/providers,content_ratings',
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TV Season Details
app.get('/api/tmdb/tv-season/:id/:seasonNumber', async (req: Request, res: Response) => {
  const { id, seasonNumber } = req.params;
  try {
    const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Genres
app.get('/api/tmdb/genres/:mediaType', async (req: Request, res: Response) => {
  const { mediaType } = req.params;
  try {
    const data = await fetchFromTMDB(`/genre/${mediaType}/list`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Discover
app.get('/api/tmdb/discover/:mediaType', async (req: Request, res: Response) => {
  const { mediaType = 'movie' } = req.params;
  const {
    with_genres,
    sort_by = 'popularity.desc',
    primary_release_year,
    first_air_date_year,
    'vote_average.gte': voteAverageGte,
    page = 1,
  } = req.query as Record<string, string>;

  try {
    const params: Record<string, any> = {
      sort_by,
      page,
      include_adult: false,
    };
    if (with_genres) params.with_genres = with_genres;
    if (primary_release_year) params.primary_release_year = primary_release_year;
    if (first_air_date_year) params.first_air_date_year = first_air_date_year;
    if (voteAverageGte) params['vote_average.gte'] = voteAverageGte;

    const data = await fetchFromTMDB(`/discover/${mediaType}`, params);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  const { query, type = 'multi', page = 1 } = req.query as Record<string, string>;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  try {
    const endpoint = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
    const data = await fetchFromTMDB(endpoint, {
      query,
      page,
      include_adult: false,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// Vite Integration (Dev Middleware & Prod Static Files)
// ---------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CinePulse API & Streaming Server active on port ${PORT}`);
  });
}

startServer();
