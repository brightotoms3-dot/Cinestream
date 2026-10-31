import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Star, Film } from 'lucide-react';
import { MovieItem } from '../types';
import { getTrending, getMovies } from '../services/api';
import { MovieCard } from '../components/common/MovieCard';

export const NewPopularPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'now_playing' | 'upcoming' | 'top_rated'>('trending');
  const [items, setItems] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        let res;
        if (activeTab === 'trending') {
          res = await getTrending('all', 'day', 1);
        } else if (activeTab === 'now_playing') {
          res = await getMovies('now_playing', 1);
        } else if (activeTab === 'upcoming') {
          res = await getMovies('upcoming', 1);
        } else {
          res = await getMovies('top_rated', 1);
        }
        if (isMounted) {
          setItems(res.results || []);
        }
      } catch (err) {
        console.error('Failed to load new and popular:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E50932] mb-1">
          <Flame className="w-4 h-4" />
          <span>Hottest Cinema Feeds</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white">
          New & Popular
        </h1>
        <p className="text-xs sm:text-sm text-[#A3AAB8] mt-1">
          Explore what is capturing global audience attention right now.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#273144] pb-3 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'trending', label: 'Trending Today', icon: Flame },
          { id: 'now_playing', label: 'Now in Theaters', icon: Film },
          { id: 'upcoming', label: 'Coming Soon', icon: Calendar },
          { id: 'top_rated', label: 'All-Time Top Rated', icon: Star },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'bg-[#E50932] text-white shadow-md'
                  : 'text-[#A3AAB8] hover:text-white hover:bg-[#151C2B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
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
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map(item => (
            <MovieCard key={item.id} movie={item} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-[#A3AAB8]">
          <p className="text-xs">No titles available in this category.</p>
        </div>
      )}
    </div>
  );
};
