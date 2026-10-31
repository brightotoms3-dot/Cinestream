import React from 'react';
import { Play, Plus, Check, Info, Sparkles } from 'lucide-react';
import { MovieItem } from '../../types';
import { getBackdropUrl } from '../../services/api';
import { RatingBadge } from '../common/RatingBadge';
import { useAuth } from '../../context/AuthContext';

interface HeroBannerProps {
  movie: MovieItem | null;
  isLoading?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movie, isLoading }) => {
  const { isInWatchlist, toggleWatchlist, setActivePlayerMedia, setActiveDetailMedia } = useAuth();

  if (isLoading || !movie) {
    return (
      <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] bg-[#101522] animate-pulse flex items-end p-8 sm:p-16">
        <div className="space-y-4 max-w-xl">
          <div className="h-6 w-32 bg-[#1C2535] rounded-full" />
          <div className="h-12 w-96 bg-[#1C2535] rounded-xl" />
          <div className="h-4 w-full bg-[#1C2535] rounded" />
          <div className="h-4 w-2/3 bg-[#1C2535] rounded" />
          <div className="flex gap-3 pt-4">
            <div className="h-12 w-36 bg-[#1C2535] rounded-xl" />
            <div className="h-12 w-36 bg-[#1C2535] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const title = movie.title || movie.name || 'Featured Cinema';
  const releaseDate = movie.release_date || movie.first_air_date || (movie.releaseYear ? `${movie.releaseYear}` : '');
  const year = releaseDate ? releaseDate.slice(0, 4) : '2024';
  const inList = isInWatchlist(movie.id);

  const backdropSrc = movie.backdrop_path
    ? getBackdropUrl(movie.backdrop_path, 'original')
    : movie.backdrop_url ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';

  const genres = movie.genres?.map(g => g.name) || (movie.genre_ids ? ['Action', 'Cinema', 'Featured'] : ['Trending']);

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-[88vh] overflow-hidden bg-[#080B12] select-none">
      {/* Background Image with layered gradient overlays */}
      <img
        src={backdropSrc}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
      />

      {/* Cinematic Vignettes */}
      <div className="absolute inset-0 hero-vignette-left" />
      <div className="absolute inset-0 hero-vignette" />

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 sm:pb-20">
        <div className="max-w-2xl space-y-3.5 sm:space-y-4">
          {/* Top Pill / Badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50932] text-white text-xs font-bold uppercase tracking-wider shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trending #1</span>
            </span>

            <RatingBadge rating={movie.vote_average || 8.5} size="md" />

            {year && (
              <span className="text-xs font-semibold text-[#A3AAB8] px-2 py-0.5 rounded bg-[#1C2535]/80 border border-[#273144]">
                {year}
              </span>
            )}

            {movie.runtime && (
              <span className="text-xs text-[#A3AAB8] font-medium">
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-none drop-shadow-xl">
            {title}
          </h1>

          {/* Genre tags */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#D6A85F]">
            {genres.slice(0, 3).map((g, i) => (
              <React.Fragment key={g}>
                <span>{g}</span>
                {i < 2 && i < genres.length - 1 && <span className="text-[#687386]">•</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Overview text */}
          <p className="text-xs sm:text-sm md:text-base text-[#A3AAB8] line-clamp-3 sm:line-clamp-4 leading-relaxed max-w-xl drop-shadow">
            {movie.overview || 'Experience this premiere title streaming on CinePulse.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 sm:pt-4 flex-wrap">
            {/* Watch Now Button */}
            <button
              onClick={() => setActivePlayerMedia(movie)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-sm font-bold shadow-xl shadow-[#E50932]/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <Play className="w-4.5 h-4.5 fill-white" />
              <span>Play Now</span>
            </button>

            {/* My List Button */}
            <button
              onClick={() => toggleWatchlist(movie)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition cursor-pointer backdrop-blur-md ${
                inList
                  ? 'bg-[#D6A85F]/20 border-[#D6A85F] text-[#D6A85F]'
                  : 'bg-[#151C2B]/80 hover:bg-[#1C2535] border-[#273144] text-white'
              }`}
            >
              {inList ? <Check className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
              <span>{inList ? 'In My List' : 'Add to List'}</span>
            </button>

            {/* More Info Button */}
            <button
              onClick={() => setActiveDetailMedia(movie)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#151C2B]/80 hover:bg-[#1C2535] border border-[#273144] text-white text-sm font-semibold transition cursor-pointer backdrop-blur-md"
            >
              <Info className="w-4.5 h-4.5" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
