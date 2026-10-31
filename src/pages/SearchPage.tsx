import React, { useState, useEffect } from 'react';
import { Search, Film, Tv, Users, SlidersHorizontal, Star, X } from 'lucide-react';
import { MovieItem } from '../types';
import { searchContent } from '../services/api';
import { MovieCard } from '../components/common/MovieCard';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'multi' | 'movie' | 'tv'>('multi');
  const [minRating, setMinRating] = useState<number>(0);
  const [results, setResults] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchContent(query.trim(), mediaType, 1);
        setResults(res.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, mediaType]);

  // Client-side rating filter
  const filteredResults = results.filter(item => {
    if (minRating === 0) return true;
    return (item.vote_average || 0) >= minRating;
  });

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh]">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white mb-2">
          Global Entertainment Search
        </h1>
        <p className="text-xs sm:text-sm text-[#A3AAB8] mb-6">
          Find movies, television shows, anime, franchises, and artists across the TMDB network.
        </p>

        {/* Big Search Input */}
        <div className="relative flex items-center bg-[#151C2B] border border-[#273144] focus-within:border-[#E50932] rounded-2xl p-2 sm:p-2.5 shadow-2xl transition">
          <Search className="w-5 h-5 text-[#A3AAB8] ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, character, director or franchise..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 text-sm sm:text-base text-white placeholder-[#687386] focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              className="p-1.5 text-[#687386] hover:text-white mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
          {/* Type filters */}
          <div className="flex bg-[#101522] p-1 rounded-xl border border-[#273144]">
            <button
              onClick={() => setMediaType('multi')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                mediaType === 'multi' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setMediaType('movie')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                mediaType === 'movie' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              Movies Only
            </button>
            <button
              onClick={() => setMediaType('tv')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                mediaType === 'tv' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              TV Series Only
            </button>
          </div>

          {/* Min Rating Slider */}
          <div className="flex items-center gap-2 bg-[#101522] px-3 py-1.5 rounded-xl border border-[#273144] text-[#A3AAB8]">
            <Star className="w-3.5 h-3.5 text-[#D6A85F]" />
            <span>Min Rating: {minRating > 0 ? `${minRating}+` : 'Any'}</span>
            <input
              type="range"
              min={0}
              max={9}
              step={1}
              value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              className="w-20 accent-[#E50932] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-[#151C2B] animate-pulse border border-[#273144]/40"
            />
          ))}
        </div>
      ) : hasSearched ? (
        filteredResults.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#A3AAB8]">
                Found <strong className="text-white">{filteredResults.length}</strong> titles matching "{query}"
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredResults.map(item => (
                <MovieCard key={item.id} movie={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-[#A3AAB8]">
            <Film className="w-12 h-12 mx-auto text-[#687386] mb-3" />
            <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
            <p className="text-xs mt-1">Check spelling or broaden your filters.</p>
          </div>
        )
      ) : (
        /* Suggested Searches */
        <div className="max-w-xl mx-auto mt-12 text-center text-xs text-[#687386]">
          <span className="uppercase tracking-wider font-semibold block mb-3 text-[#A3AAB8]">
            Popular Searches
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {['Dune', 'Arcane', 'Interstellar', 'The Dark Knight', 'Blade Runner', 'Breaking Bad', 'Avengers', 'Tears of Steel'].map(
              term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 rounded-full bg-[#151C2B] border border-[#273144] hover:border-[#E50932] text-[#A3AAB8] hover:text-white transition cursor-pointer"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
