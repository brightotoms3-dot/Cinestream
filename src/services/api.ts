import {
  MovieItem,
  Season,
  UserProfile,
  WatchlistItem,
  ContinueWatchingItem,
  UserAccount,
  StreamingProvider,
} from '../types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const getPosterUrl = (path?: string | null, size: 'w342' | 'w500' | 'original' = 'w500'): string => {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path?: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string => {
  if (!path) return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getProfileUrl = (path?: string | null, size: 'w185' | 'h632' = 'w185'): string => {
  if (!path) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cinepulse_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// In-memory client cache to prevent repetitive network requests
const clientCache = new Map<string, { timestamp: number; data: any }>();
const CLIENT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

// Safe JSON fetcher that guards against HTML responses (e.g. Vite SPA fallback)
async function safeFetchJson<T>(url: string, fallback: T, options?: RequestInit): Promise<T> {
  const cacheKey = url;
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
    return cached.data as T;
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (e.g. <!doctype html> SPA fallback during reload)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (text.trim().startsWith('<')) {
        console.warn(`[CinePulse API] Server returned HTML for ${url}, using fallback.`);
        return fallback;
      }
      try {
        const parsed = JSON.parse(text);
        clientCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
        return parsed;
      } catch {
        return fallback;
      }
    }

    if (!res.ok) {
      console.warn(`[CinePulse API] HTTP ${res.status} from ${url}, using fallback.`);
      return fallback;
    }

    const data = await res.json();
    clientCache.set(cacheKey, { timestamp: Date.now(), data });
    return data as T;
  } catch (err) {
    console.warn(`[CinePulse API] Fetch failed for ${url}:`, err);
    return fallback;
  }
}

// -------------------------------------------------------------
// TMDB API calls via secure backend proxy
// -------------------------------------------------------------
export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'day',
  page = 1
): Promise<{ results: MovieItem[]; total_pages: number }> {
  return safeFetchJson<{ results: MovieItem[]; total_pages: number }>(
    `/api/tmdb/trending/${mediaType}/${timeWindow}?page=${page}`,
    { results: [], total_pages: 1 }
  );
}

export async function getMovies(
  category: 'popular' | 'top_rated' | 'upcoming' | 'now_playing',
  page = 1
): Promise<{ results: MovieItem[]; total_pages: number }> {
  return safeFetchJson<{ results: MovieItem[]; total_pages: number }>(
    `/api/tmdb/movies/${category}?page=${page}`,
    { results: [], total_pages: 1 }
  );
}

export async function getTVShows(
  category: 'popular' | 'top_rated' | 'on_the_air' | 'airing_today',
  page = 1
): Promise<{ results: MovieItem[]; total_pages: number }> {
  return safeFetchJson<{ results: MovieItem[]; total_pages: number }>(
    `/api/tmdb/tv/${category}?page=${page}`,
    { results: [], total_pages: 1 }
  );
}

export async function getMovieDetail(id: string | number): Promise<MovieItem> {
  return safeFetchJson<MovieItem>(`/api/tmdb/movie/${id}`, {
    id,
    title: 'Movie Details',
    overview: 'Experience high-definition entertainment on CinePulse.',
    vote_average: 8.0,
  });
}

export async function getTVDetail(id: string | number): Promise<MovieItem> {
  return safeFetchJson<MovieItem>(`/api/tmdb/tv-detail/${id}`, {
    id,
    name: 'TV Series',
    overview: 'Stream all seasons and episodes on CinePulse.',
    vote_average: 8.0,
    media_type: 'tv',
  });
}

export async function getTVSeason(id: string | number, seasonNumber: number): Promise<Season> {
  return safeFetchJson<Season>(`/api/tmdb/tv-season/${id}/${seasonNumber}`, {
    id: Number(id),
    name: `Season ${seasonNumber}`,
    overview: '',
    season_number: seasonNumber,
    episode_count: 0,
    poster_path: null,
    air_date: '',
    episodes: [],
  });
}

export async function getGenres(mediaType: 'movie' | 'tv' = 'movie'): Promise<{ genres: { id: number; name: string }[] }> {
  return safeFetchJson<{ genres: { id: number; name: string }[] }>(
    `/api/tmdb/genres/${mediaType}`,
    { genres: [] }
  );
}

export async function discover(
  mediaType: 'movie' | 'tv',
  params: {
    with_genres?: string;
    sort_by?: string;
    primary_release_year?: string;
    first_air_date_year?: string;
    'vote_average.gte'?: string | number;
    page?: number;
  }
): Promise<{ results: MovieItem[]; total_pages: number }> {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      query.set(key, String(val));
    }
  }
  return safeFetchJson<{ results: MovieItem[]; total_pages: number }>(
    `/api/tmdb/discover/${mediaType}?${query.toString()}`,
    { results: [], total_pages: 1 }
  );
}

export async function searchContent(
  query: string,
  type: 'multi' | 'movie' | 'tv' = 'multi',
  page = 1
): Promise<{ results: MovieItem[]; total_pages: number }> {
  return safeFetchJson<{ results: MovieItem[]; total_pages: number }>(
    `/api/tmdb/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}`,
    { results: [], total_pages: 1 }
  );
}

// -------------------------------------------------------------
// Authentication & Profiles
// -------------------------------------------------------------
export async function apiRegister(email: string, password: string, name: string): Promise<{ token: string; user: UserAccount }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: UserAccount }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function apiGetMe(): Promise<{ user: UserAccount }> {
  const res = await fetch('/api/auth/me', {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get current user');
  return data;
}

export async function apiResetPassword(email: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  return res.json();
}

export async function apiCreateProfile(name: string, avatar?: string, isKids?: boolean): Promise<UserProfile> {
  const res = await fetch('/api/profiles', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, avatar, isKids }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create profile');
  return data;
}

export async function apiUpdateProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`/api/profiles/${profileId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

export async function apiDeleteProfile(profileId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/profiles/${profileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete profile');
  return data;
}

// -------------------------------------------------------------
// Watchlist & Continue Watching
// -------------------------------------------------------------
export async function apiGetWatchlist(profileId: string): Promise<WatchlistItem[]> {
  const data = await safeFetchJson<{ watchlist: WatchlistItem[] }>(
    `/api/user/watchlist?profileId=${profileId}`,
    { watchlist: [] },
    { headers: getAuthHeaders() }
  );
  return data.watchlist || [];
}

export async function apiAddToWatchlist(profileId: string, item: any): Promise<WatchlistItem[]> {
  const res = await fetch('/api/user/watchlist', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ profileId, item }),
  });
  if (!res.ok) throw new Error('Failed to add to watchlist');
  const data = await res.json();
  return data.watchlist;
}

export async function apiRemoveFromWatchlist(profileId: string, itemId: string | number): Promise<WatchlistItem[]> {
  const res = await fetch(`/api/user/watchlist/${itemId}?profileId=${profileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to remove from watchlist');
  const data = await res.json();
  return data.watchlist;
}

export async function apiGetContinueWatching(profileId: string): Promise<ContinueWatchingItem[]> {
  const data = await safeFetchJson<{ continueWatching: ContinueWatchingItem[] }>(
    `/api/user/continue-watching?profileId=${profileId}`,
    { continueWatching: [] },
    { headers: getAuthHeaders() }
  );
  return data.continueWatching || [];
}

export async function apiSaveContinueWatching(profileId: string, item: any): Promise<ContinueWatchingItem[]> {
  const res = await fetch('/api/user/continue-watching', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ profileId, item }),
  });
  if (!res.ok) throw new Error('Failed to update continue watching');
  const data = await res.json();
  return data.continueWatching;
}

export async function apiRemoveContinueWatching(profileId: string, itemId: string | number): Promise<ContinueWatchingItem[]> {
  const res = await fetch(`/api/user/continue-watching/${itemId}?profileId=${profileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to remove continue watching item');
  const data = await res.json();
  return data.continueWatching;
}

// -------------------------------------------------------------
// Admin & Analytics
// -------------------------------------------------------------
export async function apiGetAdminStats(): Promise<{
  stats: any;
  users: any[];
  providers: StreamingProvider[];
}> {
  return safeFetchJson(
    '/api/admin/stats',
    {
      stats: { totalUsers: 1, totalProfiles: 1, totalStreams: 100, totalWatchMinutes: 1200, popularMedia: {} },
      users: [],
      providers: [],
    },
    { headers: getAuthHeaders() }
  );
}

export async function apiUpdateProvider(providerId: string, updates: Partial<StreamingProvider>): Promise<StreamingProvider> {
  const res = await fetch(`/api/admin/providers/${providerId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update provider');
  return data;
}

export async function apiSetFeatured(featuredId: string | null): Promise<void> {
  const res = await fetch('/api/admin/featured', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ featuredId }),
  });
  if (!res.ok) throw new Error('Failed to set featured media');
}
