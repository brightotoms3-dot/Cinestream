import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Plus,
  Check,
  Share2,
  Clock,
  Tv,
} from 'lucide-react';
import { MovieItem, Season, Episode } from '../../types';
import {
  getMovieDetail,
  getTVDetail,
  getTVSeason,
  getBackdropUrl,
  getPosterUrl,
  getProfileUrl,
} from '../../services/api';
import { RatingBadge } from '../common/RatingBadge';
import { useAuth } from '../../context/AuthContext';

interface DetailModalProps {
  movie: MovieItem | null;
  onClose: () => void;
  onPlay: (movie: MovieItem) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ movie, onClose, onPlay }) => {
  const { isInWatchlist, toggleWatchlist } = useAuth();
  const [detail, setDetail] = useState<MovieItem | null>(movie);
  const [loading, setLoading] = useState(true);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isTv = movie?.media_type === 'tv' || (!movie?.title && !!movie?.name);

  useEffect(() => {
    if (!movie) return;

    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const full = isTv ? await getTVDetail(movie.id) : await getMovieDetail(movie.id);
        if (isMounted) {
          setDetail(full);
          if (isTv && full.seasons && full.seasons.length > 0) {
            const regularSeason = full.seasons.find(s => s.season_number > 0) || full.seasons[0];
            setSelectedSeasonNumber(regularSeason.season_number);
          }
        }
      } catch (err) {
        console.error('Failed to load full media detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [movie]);

  useEffect(() => {
    if (!isTv || !movie || !selectedSeasonNumber) return;

    let isMounted = true;
    setLoadingSeason(true);

    getTVSeason(movie.id, selectedSeasonNumber)
      .then(res => {
        if (isMounted) setSeasonData(res);
      })
      .catch(err => {
        console.warn('Failed to load season data:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSeason(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie, isTv, selectedSeasonNumber]);

  if (!movie) return null;

  const current = detail || movie;
  const title = current.title || current.name || 'Untitled';
  const releaseDate = current.release_date || current.first_air_date || (current.releaseYear ? `${current.releaseYear}` : '');
  const year = releaseDate ? releaseDate.slice(0, 4) : '';
  const inList = isInWatchlist(current.id);

  const backdropSrc = current.backdrop_path
    ? getBackdropUrl(current.backdrop_path, 'original')
    : current.backdrop_url ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';

  const posterSrc = current.poster_path
    ? getPosterUrl(current.poster_path, 'w500')
    : current.poster_url ||
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

  const cast = current.credits?.cast?.slice(0, 8) || [];
  const director = current.credits?.crew?.find(c => c.job === 'Director')?.name;
  const similar = current.similar?.results?.slice(0, 6) || [];
  const watchProviders = current['watch/providers']?.results?.US || current['watch/providers']?.results?.GB;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handlePlayEpisode = (episode: Episode) => {
    onPlay({
      ...current,
      title: `${title}: S${episode.season_number}E${episode.episode_number} - ${episode.name}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center p-0 sm:p-4 md:p-6 animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#101522] border-0 sm:border border-[#273144] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden my-auto text-[#F5F5F7]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-[#E50932] text-white transition cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Section */}
        <div className="relative h-72 sm:h-96 md:h-[420px] w-full overflow-hidden bg-[#080B12]">
          <img
            src={backdropSrc}
            alt={title}
            className="w-full h-full object-cover filter brightness-[0.8]"
          />
          <div className="absolute inset-0 hero-vignette" />
          <div className="absolute inset-0 hero-vignette-left" />

          {/* Floating Actions on Backdrop */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 z-20">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <RatingBadge rating={current.vote_average || 0} size="md" />
                <span className="text-xs text-[#A3AAB8] px-2 py-0.5 rounded bg-[#1C2535] border border-[#273144]">
                  {year}
                </span>
                {current.runtime && (
                  <span className="text-xs text-[#A3AAB8] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#687386]" />
                    <span>{Math.floor(current.runtime / 60)}h {current.runtime % 60}m</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white drop-shadow-md">
                {title}
              </h1>

              {current.tagline && (
                <p className="text-xs sm:text-sm italic text-[#D6A85F] drop-shadow">
                  "{current.tagline}"
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => onPlay(current)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-sm font-bold shadow-lg shadow-[#E50932]/30 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => toggleWatchlist(current)}
                className={`p-2.5 rounded-xl border transition cursor-pointer backdrop-blur-md ${
                  inList
                    ? 'bg-[#D6A85F]/20 border-[#D6A85F] text-[#D6A85F]'
                    : 'bg-[#151C2B]/80 hover:bg-[#1C2535] border-[#273144] text-white'
                }`}
                title={inList ? 'In My List' : 'Add to My List'}
              >
                {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-[#151C2B]/80 hover:bg-[#1C2535] border border-[#273144] text-[#A3AAB8] hover:text-white transition cursor-pointer backdrop-blur-md"
                title="Share title"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {copiedShare && (
                <span className="text-[11px] text-[#D6A85F] font-semibold animate-in fade-in">
                  Link Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Main Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Overview & Genres */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#687386] mb-2 font-heading">
                  Storyline
                </h3>
                <p className="text-sm sm:text-base text-[#A3AAB8] leading-relaxed">
                  {current.overview || 'No storyline summary available.'}
                </p>
              </div>

              {/* Genres */}
              <div className="pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#687386] mb-2 font-heading">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {current.genres?.map(g => (
                    <span
                      key={g.id}
                      className="px-3 py-1 rounded-lg bg-[#151C2B] border border-[#273144] text-xs font-semibold text-[#D6A85F]"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Director, Ratings & Providers */}
            <div className="space-y-4 bg-[#151C2B]/50 p-5 rounded-2xl border border-[#273144]/60 text-xs">
              {director && (
                <div>
                  <span className="text-[#687386] uppercase font-semibold">Director</span>
                  <p className="font-semibold text-white mt-0.5">{director}</p>
                </div>
              )}

              {current.status && (
                <div>
                  <span className="text-[#687386] uppercase font-semibold">Status</span>
                  <p className="font-semibold text-white mt-0.5">{current.status}</p>
                </div>
              )}

              {current.vote_count !== undefined && (
                <div>
                  <span className="text-[#687386] uppercase font-semibold">Global Ratings</span>
                  <p className="font-semibold text-[#D6A85F] mt-0.5">
                    ★ {current.vote_average.toFixed(1)} / 10 ({current.vote_count.toLocaleString()} votes)
                  </p>
                </div>
              )}

              {/* Where to Stream section */}
              {watchProviders?.flatrate && watchProviders.flatrate.length > 0 && (
                <div className="pt-2 border-t border-[#273144]">
                  <span className="text-[#687386] uppercase font-semibold block mb-2">Available To Stream On</span>
                  <div className="flex flex-wrap gap-2">
                    {watchProviders.flatrate.map(p => (
                      <div
                        key={p.provider_id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C2535] border border-[#273144]"
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-[11px] text-white font-medium">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cast Carousel / Grid */}
          {cast.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#687386] font-heading">
                Featured Cast & Crew
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {cast.map(person => (
                  <div key={person.id} className="text-center group">
                    <img
                      src={getProfileUrl(person.profile_path, 'w185')}
                      alt={person.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto ring-2 ring-[#273144] group-hover:ring-[#E50932] transition"
                    />
                    <p className="text-xs font-semibold text-white mt-2 truncate">{person.name}</p>
                    <p className="text-[10px] text-[#A3AAB8] truncate">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Shows Season & Episodes Section */}
          {isTv && current.seasons && current.seasons.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#273144]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-[#E50932]" />
                  <span>Episodes & Seasons</span>
                </h3>

                {/* Season Dropdown */}
                <select
                  value={selectedSeasonNumber}
                  onChange={e => setSelectedSeasonNumber(Number(e.target.value))}
                  className="bg-[#151C2B] border border-[#273144] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#E50932]"
                >
                  {current.seasons
                    .filter(s => s.season_number > 0)
                    .map(s => (
                      <option key={s.id} value={s.season_number}>
                        {s.name} ({s.episode_count} eps)
                      </option>
                    ))}
                </select>
              </div>

              {/* Episode list */}
              {loadingSeason ? (
                <div className="py-8 text-center text-xs text-[#A3AAB8]">Loading season episodes...</div>
              ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
                <div className="space-y-3">
                  {seasonData.episodes.map(ep => (
                    <div
                      key={ep.id}
                      onClick={() => handlePlayEpisode(ep)}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-[#151C2B]/60 hover:bg-[#151C2B] border border-[#273144]/60 hover:border-[#E50932]/60 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden bg-[#080B12] shrink-0">
                          <img
                            src={
                              ep.still_path
                                ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                : posterSrc
                            }
                            alt={ep.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Play className="w-6 h-6 fill-white text-white" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#E50932]">
                              E{ep.episode_number}
                            </span>
                            <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#E50932] transition-colors">
                              {ep.name}
                            </h4>
                          </div>
                          <p className="text-xs text-[#A3AAB8] line-clamp-2 mt-1 max-w-xl">
                            {ep.overview || 'No episode description available.'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-xs text-[#687386]">
                        {ep.runtime ? `${ep.runtime}m` : '45m'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A3AAB8]">No episodes listed for this season.</p>
              )}
            </div>
          )}

          {/* Similar Recommendations */}
          {similar.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#273144]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#687386] font-heading">
                More Like This
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {similar.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setDetail(item)}
                    className="rounded-xl overflow-hidden bg-[#151C2B] border border-[#273144]/60 hover:border-[#E50932] transition cursor-pointer group"
                  >
                    <div className="aspect-[2/3] bg-[#080B12] overflow-hidden">
                      <img
                        src={getPosterUrl(item.poster_path, 'w342')}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate">
                        {item.title || item.name}
                      </p>
                      <p className="text-[10px] text-[#A3AAB8] mt-0.5">
                        ★ {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
