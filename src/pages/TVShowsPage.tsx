import React, { useState, useEffect } from 'react';
import { Tv, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieItem } from '../types';
import { discover } from '../services/api';
import { MovieCard } from '../components/common/MovieCard';

const TV_GENRES = [
  { id: '', name: 'All TV Series' },
  { id: '10759', name: 'Action & Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '99', name: 'Documentary' },
  { id: '18', name: 'Drama' },
  { id: '10765', name: 'Sci-Fi & Fantasy' },
  { id: '9648', name: 'Mystery' },
];

export const TVShowsPage: React.FC = () => {
  const [shows, setShows] = useState<MovieItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchTV = async () => {
      try {
        const res = await discover('tv', {
          with_genres: selectedGenre || undefined,
          sort_by: sortBy,
          page,
        });
        if (isMounted) {
          setShows(
            (res.results || []).map(item => ({
              ...item,
              media_type: 'tv',
            }))
          );
          setTotalPages(Math.min(res.total_pages || 1, 50));
        }
      } catch (err) {
        console.error('Failed to load TV shows:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTV();
    return () => {
      isMounted = false;
    };
  }, [selectedGenre, sortBy, page]);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E50932] mb-1">
            <Tv className="w-4 h-4" />
            <span>Television Series Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white">
            Discover TV Shows
          </h1>
          <p className="text-xs sm:text-sm text-[#A3AAB8] mt-1">
            Stream acclaimed drama, sci-fi sagas, comedies, and episodic originals.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#151C2B] border border-[#273144] rounded-xl px-3 py-1.5 text-xs text-white">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#687386]" />
            <select
              value={sortBy}
              onChange={e => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="popularity.desc" className="bg-[#151C2B]">Most Popular</option>
              <option value="vote_average.desc" className="bg-[#151C2B]">Top Rated</option>
              <option value="first_air_date.desc" className="bg-[#151C2B]">Newest Premieres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
        {TV_GENRES.map(g => {
          const active = selectedGenre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => {
                setSelectedGenre(g.id);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'bg-[#E50932] text-white shadow-md'
                  : 'bg-[#151C2B] text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] border border-[#273144]'
              }`}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-[#151C2B] animate-pulse border border-[#273144]/40"
            />
          ))}
        </div>
      ) : shows.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {shows.map(show => (
            <MovieCard key={show.id} movie={show} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-[#A3AAB8]">
          <Tv className="w-12 h-12 mx-auto text-[#687386] mb-3" />
          <h3 className="text-base font-bold text-white">No TV Series Found</h3>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12 pt-6 border-t border-[#273144]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#151C2B] border border-[#273144] text-xs font-semibold text-white hover:bg-[#1C2535] transition disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-[#A3AAB8] font-medium px-3">
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#151C2B] border border-[#273144] text-xs font-semibold text-white hover:bg-[#1C2535] transition disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
