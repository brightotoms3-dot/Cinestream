import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieItem } from '../../types';
import { MovieCard } from './MovieCard';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: MovieItem[];
  isLoading?: boolean;
  onPlay?: (movie: MovieItem) => void;
  onOpenDetail?: (movie: MovieItem) => void;
  aspect?: 'portrait' | 'landscape';
  progressMap?: Record<string, number>;
}

export const ContentRow: React.FC<ContentRowProps> = ({
  title,
  subtitle,
  items,
  isLoading = false,
  onPlay,
  onOpenDetail,
  aspect = 'portrait',
  progressMap = {},
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  return (
    <div className="relative group/row my-6 sm:my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-heading text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            {subtitle && (
              <span className="text-xs font-normal text-[#A3AAB8] hidden sm:inline">
                {subtitle}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Row Carousel Container */}
      <div className="relative">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#101522]/90 border border-[#273144] hover:bg-[#E50932] hover:border-[#E50932] text-white items-center justify-center shadow-xl backdrop-blur-md transition cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        >
          {isLoading ? (
            // Skeleton loader placeholders
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-none w-40 sm:w-48 md:w-56 aspect-[2/3] rounded-xl bg-[#151C2B] animate-pulse border border-[#273144]/40"
              />
            ))
          ) : (
            items.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                aspect={aspect}
                progressPercent={progressMap[String(movie.id)]}
                onPlay={onPlay}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </div>

        {/* Right Arrow Button */}
        {showRightArrow && items.length > 4 && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#101522]/90 border border-[#273144] hover:bg-[#E50932] hover:border-[#E50932] text-white items-center justify-center shadow-xl backdrop-blur-md transition cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
