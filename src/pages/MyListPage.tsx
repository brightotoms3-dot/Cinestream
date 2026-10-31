import React, { useState } from 'react';
import { Bookmark, Film, Tv, Play, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MovieCard } from '../components/common/MovieCard';
import { MovieItem } from '../types';

export const MyListPage: React.FC = () => {
  const { watchlist, activeProfile, toggleWatchlist, setActivePlayerMedia } = useAuth();
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredItems = watchlist.filter(item => {
    if (filter === 'all') return true;
    return item.media_type === filter;
  });

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E50932] mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Personal Collection</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white">
            My List
          </h1>
          <p className="text-xs sm:text-sm text-[#A3AAB8] mt-1">
            Titles saved for <strong className="text-white">{activeProfile?.name || 'Your Profile'}</strong>.
          </p>
        </div>

        {/* Filter Tabs */}
        {watchlist.length > 0 && (
          <div className="flex items-center gap-2 bg-[#151C2B] p-1 rounded-xl border border-[#273144]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'all' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              All ({watchlist.length})
            </button>
            <button
              onClick={() => setFilter('movie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'movie' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setFilter('tv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'tv' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              TV Series
            </button>
          </div>
        )}
      </div>

      {/* Grid of Saved Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map(item => {
            const movieItem: MovieItem = {
              id: item.id,
              title: item.title,
              poster_path: item.poster_path,
              poster_url: item.poster_url,
              backdrop_path: item.backdrop_path,
              vote_average: item.vote_average,
              release_date: item.release_date,
              media_type: item.media_type,
              overview: '',
            };

            return (
              <div key={item.id} className="relative group/saved">
                <MovieCard movie={movieItem} />
                {/* Direct Remove Icon overlay */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleWatchlist(item);
                  }}
                  className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-black/70 hover:bg-[#E50932] text-white transition opacity-0 group-hover/saved:opacity-100 cursor-pointer shadow-lg"
                  title="Remove from My List"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center text-[#A3AAB8] bg-[#151C2B]/30 rounded-3xl border border-[#273144]/60 max-w-xl mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1C2535] border border-[#273144] flex items-center justify-center mx-auto text-[#687386] mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-heading text-white">Your List is Empty</h3>
          <p className="text-xs text-[#A3AAB8] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Click the <strong className="text-white">+ Add to List</strong> button on any movie or TV show to bookmark it here for later viewing.
          </p>
        </div>
      )}
    </div>
  );
};
