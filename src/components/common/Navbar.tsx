import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Film,
  Tv,
  Bookmark,
  Sparkles,
  Shield,
  LogOut,
  User,
  Users,
  Compass,
  X,
  Play,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { searchContent } from '../../services/api';
import { MovieItem } from '../../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenAdmin,
}) => {
  const {
    user,
    activeProfile,
    setAuthModalOpen,
    setProfileModalOpen,
    logout,
    setActivePlayerMedia,
    setActiveDetailMedia,
  } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Quick Inline Search Bar state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveResults, setLiveResults] = useState<MovieItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Notifications demo data
  const notifications = [
    { id: 1, title: 'New 4K Release', desc: 'Tears of Steel (Director\'s Cut) is now streaming in 4K HDR', time: '10m ago' },
    { id: 2, title: 'Trending', desc: 'Dune: Part Two is now top 1 on CinePulse', time: '2h ago' },
    { id: 3, title: 'TV Season Added', desc: 'Arcane Season 2 episodes now available', time: '1d ago' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside click to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchContent(searchQuery.trim(), 'multi', 1);
        setLiveResults((res.results || []).slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'movies', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'new', label: 'New & Popular' },
    { id: 'watchlist', label: 'My List' },
    { id: 'downloads', label: 'Downloads' },
  ];

  return (
    <>
      {/* Top Main Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#080B12]/95 backdrop-blur-md shadow-2xl border-b border-[#273144]/60 py-3'
            : 'bg-gradient-to-b from-[#080B12]/95 via-[#080B12]/60 to-transparent py-4.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand & Desktop Links */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#99001C] via-[#E50932] to-[#FF3358] flex items-center justify-center shadow-lg shadow-[#E50932]/25 group-hover:shadow-[#E50932]/45 transition-all">
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold tracking-wider text-xl text-white flex items-center">
                  CINE<span className="text-[#E50932]">PULSE</span>
                </span>
                <span className="text-[9px] tracking-widest text-[#D6A85F] uppercase font-semibold -mt-1 hidden sm:block">
                  Cinema & TV
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {navLinks.map(link => {
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => onSelectTab(link.id)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'text-white bg-[#1C2535] border border-[#273144] shadow-sm font-semibold'
                        : 'text-[#A3AAB8] hover:text-[#F5F5F7] hover:bg-[#151C2B]/50'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Actions: Search, PWA, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Search Input / Button */}
            <div className="relative">
              {isSearchExpanded ? (
                <div className="flex items-center bg-[#151C2B] border border-[#273144] rounded-full px-3 py-1.5 w-48 sm:w-64 transition-all shadow-inner">
                  <Search className="w-4 h-4 text-[#A3AAB8] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search movies, TV, cast..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        onOpenSearch();
                        setIsSearchExpanded(false);
                      }
                    }}
                    className="w-full bg-transparent px-2 text-xs text-white placeholder-[#687386] focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsSearchExpanded(false);
                      setSearchQuery('');
                      setLiveResults([]);
                    }}
                    className="text-[#687386] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="p-2 rounded-full text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition cursor-pointer"
                  title="Search movies and series"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              )}

              {/* Live Search Dropdown */}
              {isSearchExpanded && (liveResults.length > 0 || isSearching) && (
                <div className="absolute right-0 top-11 w-72 sm:w-80 bg-[#151C2B] border border-[#273144] rounded-2xl shadow-2xl overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#687386] uppercase flex justify-between items-center">
                    <span>Live Results</span>
                    {isSearching && <span className="text-[#E50932]">Searching...</span>}
                  </div>
                  <div className="space-y-1 mt-1">
                    {liveResults.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveDetailMedia(item);
                          setIsSearchExpanded(false);
                          setSearchQuery('');
                          setLiveResults([]);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#1C2535] text-left transition group cursor-pointer"
                      >
                        <img
                          src={
                            item.poster_path
                              ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                              : item.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={item.title || item.name}
                          className="w-9 h-12 rounded object-cover shrink-0 bg-[#101522]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[#E50932] transition-colors">
                            {item.title || item.name}
                          </p>
                          <p className="text-[11px] text-[#A3AAB8] flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{item.media_type || 'title'}</span>
                            <span>•</span>
                            <span>{(item.release_date || item.first_air_date || '').slice(0, 4) || 'Recent'}</span>
                            <span>•</span>
                            <span className="text-[#D6A85F]">★ {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#273144] mt-1 text-center">
                    <button
                      onClick={() => {
                        onOpenSearch();
                        setIsSearchExpanded(false);
                      }}
                      className="text-xs text-[#E50932] hover:underline font-medium py-1"
                    >
                      View all results in search hub →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Notification Bell */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E50932] ring-2 ring-[#080B12]" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-11 w-72 sm:w-80 bg-[#151C2B] border border-[#273144] rounded-2xl shadow-2xl overflow-hidden z-50 p-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#273144]">
                    <span className="font-heading font-bold text-sm text-white">Notifications</span>
                    <span className="text-[10px] text-[#D6A85F] font-medium uppercase tracking-wider">3 New</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2 rounded-xl bg-[#1C2535]/50 border border-[#273144]/40 hover:bg-[#1C2535] transition text-left">
                        <div className="flex justify-between items-center text-xs font-semibold text-white">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-[#687386]">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#A3AAB8] mt-0.5 leading-snug">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-[#1C2535] transition cursor-pointer"
              >
                <img
                  src={
                    activeProfile?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={activeProfile?.name || 'Profile'}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#273144] hover:ring-[#E50932] transition"
                />
                <span className="text-xs font-medium text-[#F5F5F7] hidden sm:block max-w-[100px] truncate">
                  {activeProfile?.name || 'Guest'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#A3AAB8]" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-[#151C2B] border border-[#273144] rounded-2xl shadow-2xl overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-[#273144] mb-1">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Cinema Guest'}</p>
                    <p className="text-[11px] text-[#687386] truncate">{user?.email || 'viewer@cinepulse.io'}</p>
                    {user?.role === 'admin' && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E50932]/20 text-[#E50932] border border-[#E50932]/30">
                        Admin Account
                      </span>
                    )}
                  </div>

                  {/* Switch Profile */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#D6A85F]" />
                    <span>Switch Profile</span>
                  </button>

                  {/* Admin Console */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#E50932]" />
                    <span>Admin Dashboard</span>
                  </button>

                  <div className="my-1 border-t border-[#273144]" />

                  {/* Login or Logout */}
                  {user?.id !== 'guest_user' ? (
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-[#1C2535] transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#E50932] hover:bg-[#cc082c] transition cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Sign Up</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Optimized for Android / Samsung Galaxy viewports) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#101522]/95 backdrop-blur-lg border-t border-[#273144] py-2 px-2 flex justify-around items-center">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            currentTab === 'home' ? 'text-[#E50932] font-semibold' : 'text-[#A3AAB8]'
          }`}
        >
          <Film className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onSelectTab('movies')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            currentTab === 'movies' ? 'text-[#E50932] font-semibold' : 'text-[#A3AAB8]'
          }`}
        >
          <Film className="w-5 h-5" />
          <span>Movies</span>
        </button>

        <button
          onClick={() => onSelectTab('tv')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            currentTab === 'tv' ? 'text-[#E50932] font-semibold' : 'text-[#A3AAB8]'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span>TV Shows</span>
        </button>

        <button
          onClick={onOpenSearch}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            currentTab === 'search' ? 'text-[#E50932] font-semibold' : 'text-[#A3AAB8]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => onSelectTab('watchlist')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            currentTab === 'watchlist' ? 'text-[#E50932] font-semibold' : 'text-[#A3AAB8]'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>My List</span>
        </button>

        <button
          onClick={() => onSelectTab('downloads')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            currentTab === 'downloads' ? 'text-[#E50932] font-semibold' : 'text-[#A3AAB8]'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>Downloads</span>
        </button>
      </nav>
    </>
  );
};
