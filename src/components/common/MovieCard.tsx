import React, { useState } from 'react';
import { Play, Plus, Check, Info } from 'lucide-react';
import { MovieItem } from '../../types';
import { getPosterUrl } from '../../services/api';
import { RatingBadge } from './RatingBadge';
import { useAuth } from '../../context/AuthContext';

interface MovieCardProps {
  movie: MovieItem;
  progressPercent?: number;
  onPlay?: (movie: MovieItem) => void;
  onOpenDetail?: (movie: MovieItem) => void;
  aspect?: 'portrait' | 'landscape';
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  progressPercent,
  onPlay,
  onOpenDetail,
  aspect = 'portrait',
}) => {
  const { isInWatchlist, toggleWatchlist, setActivePlayerMedia, setActiveDetailMedia } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const title = movie.title || movie.name || 'Untitled';
  const releaseDate = movie.release_date || movie.first_air_date || (movie.releaseYear ? `${movie.releaseYear}` : '');
  const year = releaseDate ? releaseDate.slice(0, 4) : '';
  const inList = isInWatchlist(movie.id);

  const posterSrc = movie.poster_path
    ? getPosterUrl(movie.poster_path, 'w500')
    : movie.poster_url ||
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(movie);
    } else {
      setActivePlayerMedia(movie);
    }
  };

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDetail) {
      onOpenDetail(movie);
    } else {
      setActiveDetailMedia(movie);
    }
  };

  const handleListToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  return (
    <div
      onClick={handleDetailClick}
      className="group relative flex-none w-40 sm:w-48 md:w-56 rounded-xl overflow-hidden bg-[#151C2B] border border-[#273144]/60 hover:border-[#E50932]/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#080B12]/90 cursor-pointer select-none"
    >
      {/* Aspect Ratio Container */}
      <div className={`relative w-full ${aspect === 'portrait' ? 'aspect-[2/3]' : 'aspect-video'} bg-[#101522] overflow-hidden`}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-[#151C2B] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#273144] border-t-[#E50932] animate-spin" />
          </div>
        )}

        <img
          src={posterSrc}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Rating Badge top-right */}
        <div className="absolute top-2 right-2 z-10">
          <RatingBadge rating={movie.vote_average || 0} size="sm" />
        </div>

        {/* Dark Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-[#080B12]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
          <h4 className="text-white text-sm font-bold font-heading line-clamp-1 drop-shadow-md">
            {title}
          </h4>

          <div className="flex items-center gap-2 text-[11px] text-[#A3AAB8] mt-1 mb-3">
            {year && <span>{year}</span>}
            <span>•</span>
            <span className="capitalize">{movie.media_type || (movie.title ? 'Movie' : 'TV')}</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#E50932] hover:bg-[#cc082c] text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play</span>
            </button>

            <button
              onClick={handleListToggle}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                inList
                  ? 'bg-[#D6A85F]/20 border-[#D6A85F] text-[#D6A85F]'
                  : 'bg-[#1C2535]/80 border-[#273144] text-[#F5F5F7] hover:text-white hover:border-white'
              }`}
              title={inList ? 'In My List' : 'Add to My List'}
            >
              {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDetailClick}
              className="p-1.5 rounded-lg bg-[#1C2535]/80 border border-[#273144] text-[#F5F5F7] hover:text-white hover:border-white transition cursor-pointer"
              title="More Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playback progress bar for continue watching */}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1C2535]">
            <div
              className="h-full bg-[#E50932]"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Footer Info */}
      <div className="p-2.5 sm:p-3">
        <h3 className="text-xs sm:text-sm font-semibold text-[#F5F5F7] truncate group-hover:text-white transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-[#A3AAB8] mt-1">
          <span>{year || '2024'}</span>
          <span className="capitalize text-[#687386]">
            {movie.media_type === 'tv' ? 'Series' : 'Feature'}
          </span>
        </div>
      </div>
    </div>
  );
};
