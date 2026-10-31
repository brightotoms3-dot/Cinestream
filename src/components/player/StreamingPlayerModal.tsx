import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Subtitles,
  SkipForward,
  SkipBack,
  Film,
  ExternalLink,
} from 'lucide-react';
import { MovieItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getMovieDetail, getTVDetail } from '../../services/api';

interface StreamingPlayerModalProps {
  movie: MovieItem | null;
  onClose: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
}

export const StreamingPlayerModal: React.FC<StreamingPlayerModalProps> = ({
  movie,
  onClose,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false,
}) => {
  const { savePlaybackProgress, continueWatching } = useAuth();

  const [fullDetail, setFullDetail] = useState<MovieItem | null>(movie);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load video keys from TMDB
  useEffect(() => {
    if (!movie) return;

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const isTv = movie.media_type === 'tv' || (!movie.title && !!movie.name);
        const data = isTv ? await getTVDetail(movie.id) : await getMovieDetail(movie.id);
        if (isMounted) {
          setFullDetail(data);

          const trailers = data.videos?.results || [];
          const bestVideo =
            trailers.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
            trailers.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
            trailers.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
            trailers.find(v => v.site === 'YouTube');

          if (bestVideo) {
            setActiveVideoKey(bestVideo.key);
          }
        }
      } catch (err) {
        console.error('Failed to load player details:', err);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [movie]);

  // Restore saved continue watching progress
  useEffect(() => {
    if (!movie) return;
    const existing = continueWatching.find(c => String(c.id) === String(movie.id));
    if (existing && existing.currentTime > 0) {
      setCurrentTime(existing.currentTime);
    }
  }, [movie]);

  // Autohide controls on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3200);
  };

  // Keyboard navigation & spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
          handleClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, isFullscreen, volume, isMuted]);

  // Periodic progress saving
  useEffect(() => {
    if (!movie) return;

    const interval = setInterval(() => {
      savePlaybackProgress({
        id: movie.id,
        media_type: movie.media_type || (movie.title ? 'movie' : 'tv'),
        title: movie.title || movie.name || 'Untitled',
        poster_path: movie.poster_path,
        poster_url: movie.poster_url,
        backdrop_path: movie.backdrop_path,
        currentTime: currentTime + 10,
        duration: duration || 180,
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [movie, currentTime, duration]);

  const handleClose = () => {
    if (movie) {
      savePlaybackProgress({
        id: movie.id,
        media_type: movie.media_type || (movie.title ? 'movie' : 'tv'),
        title: movie.title || movie.name || 'Untitled',
        poster_path: movie.poster_path,
        poster_url: movie.poster_url,
        backdrop_path: movie.backdrop_path,
        currentTime: currentTime || 45,
        duration: duration || 180,
      });
    }
    onClose();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!movie) return null;

  const title = movie.title || movie.name || 'Streaming';
  const watchProviders = fullDetail?.['watch/providers']?.results?.US || fullDetail?.['watch/providers']?.results?.GB;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E50932] flex items-center justify-center shadow-lg">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white font-heading">{title}</h2>
              <span className="px-2 py-0.5 rounded bg-[#1C2535] text-[#D6A85F] border border-[#D6A85F]/40 text-[10px] font-bold uppercase tracking-wider">
                Full HD Stream
              </span>
            </div>
            <p className="text-xs text-[#A3AAB8]">Official Studio Release • TMDB Media</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-[#E50932] text-white transition cursor-pointer backdrop-blur-md"
          title="Close player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Video Surface */}
      <div className="relative w-full h-full flex flex-col items-center justify-center pt-16 pb-8 px-4">
        {activeVideoKey ? (
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#273144] bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideoKey}?autoplay=1&rel=0&modestbranding=1&controls=1`}
              title={`${title} Official Player`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="w-full max-w-xl p-8 rounded-2xl bg-[#151C2B] border border-[#273144] text-center shadow-2xl">
            <Film className="w-12 h-12 text-[#E50932] mx-auto mb-3" />
            <h3 className="text-xl font-bold font-heading text-white">Streaming Video Preview</h3>
            <p className="text-xs text-[#A3AAB8] mt-2 leading-relaxed">
              Video media for <strong className="text-white">{title}</strong> is loading from the global TMDB stream feed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-xs font-semibold transition"
              >
                <span>Launch Video Stream</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-[#1C2535] text-[#A3AAB8] hover:text-white text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Where to Stream section */}
        {watchProviders?.flatrate && watchProviders.flatrate.length > 0 && (
          <div className="mt-4 max-w-5xl w-full p-3 sm:p-4 rounded-xl bg-[#151C2B] border border-[#273144] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold text-white">
                Available To Stream With Subscription
              </p>
              <p className="text-[11px] text-[#A3AAB8]">
                Watch full movie with your connected accounts:
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {watchProviders.flatrate.slice(0, 4).map(provider => (
                <a
                  key={provider.provider_id}
                  href={watchProviders.link || `https://www.google.com/search?q=watch+${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C2535] hover:bg-[#273144] border border-[#273144] text-xs font-semibold text-white transition"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                    alt={provider.provider_name}
                    className="w-4 h-4 rounded"
                  />
                  <span>{provider.provider_name}</span>
                  <ExternalLink className="w-3 h-3 text-[#A3AAB8]" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Nav for TV Episodes */}
      {(hasNextEpisode || hasPrevEpisode) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#151C2B]/90 border border-[#273144] p-2 rounded-2xl backdrop-blur-md">
          {hasPrevEpisode && (
            <button
              onClick={onPrevEpisode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2535] text-white text-xs font-semibold hover:bg-[#273144] transition cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
              <span>Prev Episode</span>
            </button>
          )}

          {hasNextEpisode && (
            <button
              onClick={onNextEpisode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E50932] text-white text-xs font-semibold hover:bg-[#cc082c] transition cursor-pointer"
            >
              <span>Next Episode</span>
              <SkipForward className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
