import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Tv,
  AlertTriangle,
} from 'lucide-react';
import { MovieItem, Season } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getMovieDetail, getTVDetail, getTVSeason } from '../../services/api';
import { getVidSrcEmbedUrl, VIDSRC_MIRRORS } from '../../services/providers/vidsrc';

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
  hasNextEpisode,
  hasPrevEpisode,
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

  // VidSrc provider state (season/episode selection & embed lifecycle)
  const [season, setSeason] = useState<number>(movie?.seasonNumber ?? 1);
  const [episode, setEpisode] = useState<number>(movie?.episodeNumber ?? 1);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedTimedOut, setEmbedTimedOut] = useState(false);
  const [embedAttempt, setEmbedAttempt] = useState(0);
  const [mirrorIndex, setMirrorIndex] = useState(0);
  const [trailerMode, setTrailerMode] = useState(false);
  const embedLoadedRef = useRef(false);
  const embedUrlRef = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build the authorized VidSrc embed URL (no API key or login required).
  // VidSrc accepts IMDb or TMDB IDs — the app uses its existing TMDB IDs.
  const embedUrl = useMemo(() => {
    if (!movie) return null;
    const isTv = movie.media_type === 'tv' || (!movie.title && !!movie.name);
    return getVidSrcEmbedUrl({
      mediaType: isTv ? 'tv' : 'movie',
      id: movie.id,
      season: isTv ? season : undefined,
      episode: isTv ? episode : undefined,
      mirror: mirrorIndex,
    });
  }, [movie, season, episode, mirrorIndex]);
  embedUrlRef.current = embedUrl;

  // VidSrc relays MEDIA_NOT_FOUND up from its innermost player when the
  // current mirror can't resolve the title — fall through to the next mirror,
  // or surface our own error card once every mirror has been tried.
  const handledUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string } | null;
      if (!data || data.type !== 'MEDIA_NOT_FOUND') return;
      const originOk = VIDSRC_MIRRORS.some(m => e.origin === new URL(m).origin);
      const url = embedUrlRef.current;
      if (!originOk || !url || handledUrlRef.current === url) return;
      handledUrlRef.current = url; // one fallback per failed mirror URL

      setEmbedLoaded(true); // stop the spinner over a failed mirror
      if (mirrorIndex < VIDSRC_MIRRORS.length - 1) {
        setEmbedAttempt(a => a + 1); // force iframe remount on the new mirror
        setMirrorIndex(mirrorIndex + 1);
      } else {
        setEmbedTimedOut(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mirrorIndex]);

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

    // Reset playback selection whenever a different title is opened
    setSeason(movie.seasonNumber ?? 1);
    setEpisode(movie.episodeNumber ?? 1);
    setSeasonData(null);
    setTrailerMode(false);
    setMirrorIndex(0);
    setEmbedTimedOut(false);

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [movie]);

  // Load season episodes so the player can offer season/episode selection for TV
  useEffect(() => {
    if (!movie) return;
    const isTv = movie.media_type === 'tv' || (!movie.title && !!movie.name);
    if (!isTv) return;

    let isMounted = true;
    getTVSeason(movie.id, season)
      .then(res => {
        if (isMounted) setSeasonData(res);
      })
      .catch(err => {
        console.warn('Failed to load season data for player:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [movie, season]);

  // Loading/error lifecycle for the VidSrc embed iframe
  useEffect(() => {
    if (!embedUrl || trailerMode) return;
    embedLoadedRef.current = false;
    setEmbedLoaded(false);
    setEmbedTimedOut(false);

    // If the embed never fires onLoad, surface a graceful error with retry options
    const timer = setTimeout(() => {
      if (!embedLoadedRef.current) {
        setEmbedTimedOut(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [embedUrl, embedAttempt, trailerMode]);

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

  const handleEmbedLoad = () => {
    embedLoadedRef.current = true;
    setEmbedLoaded(true);
  };

  const handleRetryEmbed = () => {
    setEmbedTimedOut(false);
    setMirrorIndex(0); // start over from the primary mirror
    setEmbedAttempt(prev => prev + 1);
  };

  if (!movie) return null;

  const title = movie.title || movie.name || 'Streaming';
  const watchProviders = fullDetail?.['watch/providers']?.results?.US || fullDetail?.['watch/providers']?.results?.GB;

  const isTvMedia = movie.media_type === 'tv' || (!movie.title && !!movie.name);
  const seasons = (fullDetail?.seasons || []).filter(s => s.season_number > 0);
  const currentSeasonInfo = seasons.find(s => s.season_number === season);
  const episodeTotal = seasonData?.episodes?.length || currentSeasonInfo?.episode_count || 0;
  const episodeOptions: { number: number; name?: string }[] = seasonData?.episodes?.length
    ? seasonData.episodes.map(e => ({ number: e.episode_number, name: e.name }))
    : Array.from({ length: Math.max(episodeTotal, episode) }, (_, i) => ({ number: i + 1 }));
  const currentEpisodeName = seasonData?.episodes?.find(e => e.episode_number === episode)?.name;

  const handleSeasonChange = (value: number) => {
    setSeason(value);
    setEpisode(1);
  };

  const handleEpisodeChange = (value: number) => {
    setEpisode(value);
  };

  const canGoNext = isTvMedia && (episode < episodeTotal || seasons.some(s => s.season_number > season));
  const canGoPrev = isTvMedia && (episode > 1 || season > 1);
  const showNext = hasNextEpisode ?? canGoNext;
  const showPrev = hasPrevEpisode ?? canGoPrev;

  const handleNextEpisode = () => {
    if (onNextEpisode) return onNextEpisode();
    if (episode < episodeTotal || !episodeTotal) {
      setEpisode(prev => prev + 1);
      return;
    }
    const nextSeason = seasons.find(s => s.season_number > season);
    if (nextSeason) {
      setSeason(nextSeason.season_number);
      setEpisode(1);
    }
  };

  const handlePrevEpisode = () => {
    if (onPrevEpisode) return onPrevEpisode();
    if (episode > 1) {
      setEpisode(prev => prev - 1);
      return;
    }
    const earlierSeasons = seasons.filter(s => s.season_number < season);
    const prevSeason = earlierSeasons[earlierSeasons.length - 1];
    if (prevSeason) {
      setSeason(prevSeason.season_number);
      setEpisode(prevSeason.episode_count || 1);
    }
  };

  const useTrailer = trailerMode || !embedUrl;

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
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center pt-16 px-4 overflow-y-auto ${
          showNext || showPrev ? 'pb-24' : 'pb-8'
        }`}
      >
        {!useTrailer && embedTimedOut ? (
          /* Graceful embed failure: retry, open externally, or fall back to the trailer */
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#273144] bg-[#151C2B] flex flex-col items-center justify-center text-center px-6">
            <AlertTriangle className="w-12 h-12 text-[#E50932] mb-3" />
            <h3 className="text-xl font-bold font-heading text-white">Stream could not be loaded</h3>
            <p className="text-xs text-[#A3AAB8] mt-2 max-w-md leading-relaxed">
              The player for <strong className="text-white">{title}</strong>
              {isTvMedia ? ` (S${season} E${episode})` : ''} did not respond in time. It may be
              unavailable right now.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleRetryEmbed}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <a
                href={embedUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C2535] hover:bg-[#273144] text-white text-xs font-semibold transition"
              >
                <span>Open In New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {activeVideoKey && (
                <button
                  onClick={() => setTrailerMode(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#101522] text-[#A3AAB8] hover:text-white text-xs font-medium transition"
                >
                  Watch Trailer
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-[#101522] text-[#A3AAB8] hover:text-white text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : !useTrailer ? (
          /* VidSrc authorized embed player */
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#273144] bg-black">
            <iframe
              key={`${embedUrl}#${embedAttempt}`}
              src={embedUrl as string}
              onLoad={handleEmbedLoad}
              title={`${title} Player`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />

            {/* Loading overlay until the embed reports ready */}
            {!embedLoaded && (
              <div className="absolute inset-0 z-10 bg-[#080B12] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#273144] border-t-[#E50932] animate-spin" />
                <p className="text-xs text-[#A3AAB8]">
                  Loading stream for <strong className="text-white">{title}</strong>
                  {isTvMedia ? ` • S${season} E${episode}` : ''}…
                </p>
              </div>
            )}
          </div>
        ) : activeVideoKey ? (
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#273144] bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideoKey}?autoplay=1&rel=0&modestbranding=1&controls=1`}
              title={`${title} Official Player`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : null}

        {/* Season & Episode selector for TV shows */}
        {isTvMedia && (
          <div className="mt-4 max-w-5xl w-full p-3 sm:p-4 rounded-xl bg-[#151C2B] border border-[#273144] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-left min-w-0">
              <span className="w-8 h-8 rounded-lg bg-[#1C2535] flex items-center justify-center shrink-0">
                <Tv className="w-4 h-4 text-[#E50932]" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  Season {season} • Episode {episode}
                </p>
                {currentEpisodeName && (
                  <p className="text-[11px] text-[#A3AAB8] truncate">{currentEpisodeName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <select
                value={season}
                onChange={e => handleSeasonChange(Number(e.target.value))}
                aria-label="Select season"
                className="bg-[#1C2535] border border-[#273144] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#E50932] cursor-pointer"
              >
                {seasons.length > 0 ? (
                  seasons.map(s => (
                    <option key={s.id} value={s.season_number}>
                      {s.name} ({s.episode_count} eps)
                    </option>
                  ))
                ) : (
                  <option value={season}>Season {season}</option>
                )}
              </select>

              <select
                value={episode}
                onChange={e => handleEpisodeChange(Number(e.target.value))}
                aria-label="Select episode"
                className="bg-[#1C2535] border border-[#273144] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#E50932] cursor-pointer"
              >
                {episodeOptions.map(opt => (
                  <option key={opt.number} value={opt.number}>
                    Episode {opt.number}
                    {opt.name ? ` — ${opt.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Nav for TV Episodes */}
      {(showNext || showPrev) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#151C2B]/90 border border-[#273144] p-2 rounded-2xl backdrop-blur-md">
          {showPrev && (
            <button
              onClick={handlePrevEpisode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2535] text-white text-xs font-semibold hover:bg-[#273144] transition cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
              <span>Prev Episode</span>
            </button>
          )}

          {showNext && (
            <button
              onClick={handleNextEpisode}
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
