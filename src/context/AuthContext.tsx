import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserProfile, WatchlistItem, ContinueWatchingItem, MovieItem } from '../types';
import {
  apiGetMe,
  apiLogin,
  apiRegister,
  apiGetWatchlist,
  apiAddToWatchlist,
  apiRemoveFromWatchlist,
  apiGetContinueWatching,
  apiSaveContinueWatching,
  apiRemoveContinueWatching,
} from '../services/api';

interface AuthContextType {
  user: UserAccount | null;
  activeProfile: UserProfile | null;
  setActiveProfile: (profile: UserProfile) => void;
  watchlist: WatchlistItem[];
  continueWatching: ContinueWatchingItem[];
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  activePlayerMedia: MovieItem | null;
  setActivePlayerMedia: (media: MovieItem | null) => void;
  activeDetailMedia: MovieItem | null;
  setActiveDetailMedia: (media: MovieItem | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  isInWatchlist: (id: string | number) => boolean;
  toggleWatchlist: (item: any) => Promise<void>;
  savePlaybackProgress: (item: any) => Promise<void>;
  removePlaybackProgress: (id: string | number) => Promise<void>;
  refreshProfileData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [activeProfile, setActiveProfileState] = useState<UserProfile | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals and Active Media Player states
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [activePlayerMedia, setActivePlayerMedia] = useState<MovieItem | null>(null);
  const [activeDetailMedia, setActiveDetailMedia] = useState<MovieItem | null>(null);

  // Initial load
  useEffect(() => {
    async function initUser() {
      const token = localStorage.getItem('cinepulse_token');
      if (token) {
        try {
          const { user } = await apiGetMe();
          setUser(user);
          const savedProfId = localStorage.getItem('cinepulse_profile_id');
          const prof = user.profiles.find(p => p.id === savedProfId) || user.profiles[0];
          setActiveProfileState(prof);
          if (prof) {
            loadProfileData(prof.id);
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('cinepulse_token');
          // Fallback to guest demo profile
          setupGuestSession();
        }
      } else {
        setupGuestSession();
      }
      setIsLoading(false);
    }

    initUser();
  }, []);

  function setupGuestSession() {
    const guestUser: UserAccount = {
      id: 'guest_user',
      email: 'viewer@cinepulse.io',
      name: 'Cinema Guest',
      role: 'user',
      profiles: [
        {
          id: 'guest_prof_1',
          name: 'Cinema Guest',
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
    setUser(guestUser);
    setActiveProfileState(guestUser.profiles[0]);
    setContinueWatching(guestUser.profiles[0].continueWatching);
    setWatchlist([]);
  }

  async function loadProfileData(profileId: string) {
    try {
      const [wl, cw] = await Promise.all([
        apiGetWatchlist(profileId),
        apiGetContinueWatching(profileId),
      ]);
      setWatchlist(wl);
      setContinueWatching(cw);
    } catch (e) {
      console.error('Failed to load profile watchlist/continue watching:', e);
    }
  }

  const setActiveProfile = (profile: UserProfile) => {
    setActiveProfileState(profile);
    localStorage.setItem('cinepulse_profile_id', profile.id);
    loadProfileData(profile.id);
  };

  const login = async (email: string, pass: string) => {
    const data = await apiLogin(email, pass);
    localStorage.setItem('cinepulse_token', data.token);
    setUser(data.user);
    const prof = data.user.profiles[0];
    setActiveProfileState(prof);
    if (prof) {
      localStorage.setItem('cinepulse_profile_id', prof.id);
      loadProfileData(prof.id);
    }
    setAuthModalOpen(false);
  };

  const register = async (email: string, pass: string, name: string) => {
    const data = await apiRegister(email, pass, name);
    localStorage.setItem('cinepulse_token', data.token);
    setUser(data.user);
    const prof = data.user.profiles[0];
    setActiveProfileState(prof);
    if (prof) {
      localStorage.setItem('cinepulse_profile_id', prof.id);
      loadProfileData(prof.id);
    }
    setAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('cinepulse_token');
    localStorage.removeItem('cinepulse_profile_id');
    setupGuestSession();
  };

  const isInWatchlist = (id: string | number): boolean => {
    return watchlist.some(w => String(w.id) === String(id));
  };

  const toggleWatchlist = async (item: any) => {
    if (!activeProfile) return;
    const exists = isInWatchlist(item.id);
    if (exists) {
      setWatchlist(prev => prev.filter(w => String(w.id) !== String(item.id)));
      if (user?.id !== 'guest_user') {
        try {
          const updated = await apiRemoveFromWatchlist(activeProfile.id, item.id);
          setWatchlist(updated);
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      const watchItem: WatchlistItem = {
        id: item.id,
        media_type: item.media_type || (item.title ? 'movie' : 'tv'),
        title: item.title || item.name || 'Untitled',
        poster_path: item.poster_path,
        poster_url: item.poster_url || item.posterUrl,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average || item.rating || 0,
        release_date: item.release_date || item.first_air_date || (item.releaseYear ? `${item.releaseYear}-01-01` : ''),
        addedAt: new Date().toISOString(),
      };
      setWatchlist(prev => [watchItem, ...prev]);
      if (user?.id !== 'guest_user') {
        try {
          const updated = await apiAddToWatchlist(activeProfile.id, watchItem);
          setWatchlist(updated);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const savePlaybackProgress = async (item: any) => {
    if (!activeProfile) return;
    const progressPercent = Math.round((item.currentTime / (item.duration || 1)) * 100);
    const cwItem: ContinueWatchingItem = {
      id: item.id,
      media_type: item.media_type || (item.title ? 'movie' : 'tv'),
      title: item.title || item.name || 'Untitled',
      poster_path: item.poster_path,
      poster_url: item.poster_url || item.posterUrl,
      backdrop_path: item.backdrop_path,
      currentTime: item.currentTime,
      duration: item.duration,
      progressPercent,
      seasonNumber: item.seasonNumber,
      episodeNumber: item.episodeNumber,
      episodeTitle: item.episodeTitle,
      lastWatched: new Date().toISOString(),
    };

    setContinueWatching(prev => {
      const filtered = prev.filter(c => String(c.id) !== String(item.id));
      if (progressPercent < 95) {
        return [cwItem, ...filtered];
      }
      return filtered;
    });

    if (user?.id !== 'guest_user') {
      try {
        await apiSaveContinueWatching(activeProfile.id, cwItem);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const removePlaybackProgress = async (id: string | number) => {
    if (!activeProfile) return;
    setContinueWatching(prev => prev.filter(c => String(c.id) !== String(id)));
    if (user?.id !== 'guest_user') {
      try {
        await apiRemoveContinueWatching(activeProfile.id, id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const refreshProfileData = async () => {
    if (activeProfile && user?.id !== 'guest_user') {
      await loadProfileData(activeProfile.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        setActiveProfile,
        watchlist,
        continueWatching,
        isLoading,
        isAuthModalOpen,
        setAuthModalOpen,
        isProfileModalOpen,
        setProfileModalOpen,
        activePlayerMedia,
        setActivePlayerMedia,
        activeDetailMedia,
        setActiveDetailMedia,
        login,
        register,
        logout,
        isInWatchlist,
        toggleWatchlist,
        savePlaybackProgress,
        removePlaybackProgress,
        refreshProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
