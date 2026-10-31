export interface MovieItem {
  id: number | string;
  title?: string;
  name?: string; // For TV shows
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  poster_url?: string;
  backdrop_url?: string;
  media_type?: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  releaseYear?: number;
  vote_average: number;
  vote_count?: number;
  rating?: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: VideoTrailer[];
  };
  similar?: {
    results: MovieItem[];
  };
  recommendations?: {
    results: MovieItem[];
  };
  'watch/providers'?: {
    results?: Record<string, WatchProviderRegion>;
  };
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface VideoTrailer {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
}

export interface WatchProviderRegion {
  link?: string;
  flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
  rent?: { provider_id: number; provider_name: string; logo_path: string }[];
  buy?: { provider_id: number; provider_name: string; logo_path: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  watchlist: WatchlistItem[];
  continueWatching: ContinueWatchingItem[];
  preferences: {
    audioLanguage: string;
    subtitleLanguage: string;
    autoplayNext: boolean;
    defaultQuality: string;
  };
}

export interface WatchlistItem {
  id: number | string;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string | null;
  poster_url?: string;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  addedAt: string;
}

export interface ContinueWatchingItem {
  id: number | string;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string | null;
  poster_url?: string;
  backdrop_path?: string | null;
  backdrop_url?: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  lastWatched: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  profiles: UserProfile[];
}

export interface StreamingProvider {
  id: string;
  name: string;
  badgeColor: string;
  logo: string;
  active: boolean;
  searchUrl: string;
}
