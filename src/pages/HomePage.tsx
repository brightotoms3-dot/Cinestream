import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/home/HeroBanner';
import { ContentRow } from '../components/common/ContentRow';
import { MovieItem } from '../types';
import {
  getTrending,
  getMovies,
  getTVShows,
  discover,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { continueWatching, activeProfile } = useAuth();

  const [heroMovie, setHeroMovie] = useState<MovieItem | null>(null);
  const [trendingItems, setTrendingItems] = useState<MovieItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MovieItem[]>([]);
  const [popularTV, setPopularTV] = useState<MovieItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<MovieItem[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<MovieItem[]>([]);
  const [actionMovies, setActionMovies] = useState<MovieItem[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<MovieItem[]>([]);
  const [comedyMovies, setComedyMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const results = await Promise.allSettled([
          getTrending('all', 'day', 1),
          getMovies('popular', 1),
          getMovies('top_rated', 1),
          getTVShows('popular', 1),
          getMovies('now_playing', 1),
          getMovies('upcoming', 1),
          discover('movie', { with_genres: '28', sort_by: 'popularity.desc' }), // Action
          discover('movie', { with_genres: '878', sort_by: 'popularity.desc' }), // Sci-Fi
          discover('movie', { with_genres: '35', sort_by: 'popularity.desc' }), // Comedy
        ]);

        if (isMounted) {
          const extract = (idx: number) => {
            const res = results[idx];
            if (res.status === 'fulfilled' && res.value?.results) {
              return res.value.results;
            }
            return [];
          };

          const trending = extract(0);
          const popular = extract(1);
          const topRated = extract(2);
          const tv = extract(3);
          const now = extract(4);
          const upcoming = extract(5);
          const action = extract(6);
          const scifi = extract(7);
          const comedy = extract(8);

          setTrendingItems(trending);
          setPopularMovies(popular);
          setTopRatedMovies(topRated);
          setPopularTV(tv);
          setNowPlaying(now);
          setUpcomingMovies(upcoming);
          setActionMovies(action);
          setSciFiMovies(scifi);
          setComedyMovies(comedy);

          // Hero featured movie selection
          const topPick = trending[0] || popular[0] || now[0] || null;
          setHeroMovie(topPick);
        }
      } catch (err) {
        console.warn('Notice loading home feed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map progress for continue watching
  const continueWatchingItems: MovieItem[] = continueWatching.map(cw => ({
    id: cw.id,
    title: cw.title,
    overview: 'Resume playback where you left off',
    poster_path: cw.poster_path,
    poster_url: cw.poster_url,
    backdrop_path: cw.backdrop_path,
    media_type: cw.media_type,
    vote_average: 8.5,
  }));

  const progressMap: Record<string, number> = {};
  continueWatching.forEach(c => {
    progressMap[String(c.id)] = c.progressPercent;
  });

  return (
    <div className="pb-16">
      {/* Featured Hero Banner */}
      <HeroBanner movie={heroMovie} isLoading={loading} />

      {/* Continue Watching Row (if profile has ongoing items) */}
      {continueWatchingItems.length > 0 && (
        <ContentRow
          title={`Continue Watching for ${activeProfile?.name || 'You'}`}
          subtitle="Resume right where you paused"
          items={continueWatchingItems}
          progressMap={progressMap}
          aspect="landscape"
        />
      )}

      {/* Trending Today */}
      <ContentRow
        title="Trending Today"
        subtitle="The most-watched titles globally right now"
        items={trendingItems}
        isLoading={loading}
      />

      {/* Blockbuster Movies */}
      <ContentRow
        title="Blockbuster Movies"
        subtitle="Audience favorites and major box office releases"
        items={popularMovies}
        isLoading={loading}
      />

      {/* Popular TV Shows */}
      <ContentRow
        title="Binge-Worthy TV Series"
        subtitle="Critically acclaimed shows and episodic sagas"
        items={popularTV}
        isLoading={loading}
      />

      {/* Now in Theaters */}
      <ContentRow
        title="Now in Theaters"
        subtitle="Currently screening in cinema halls worldwide"
        items={nowPlaying}
        isLoading={loading}
      />

      {/* Upcoming Blockbusters */}
      <ContentRow
        title="Upcoming Premieres"
        subtitle="Anticipated releases heading to screens soon"
        items={upcomingMovies}
        isLoading={loading}
      />

      {/* Top Rated Classics */}
      <ContentRow
        title="Top Rated Masterpieces"
        subtitle="Highest-rated cinema of all time"
        items={topRatedMovies}
        isLoading={loading}
      />

      {/* Sci-Fi & Cyberpunk */}
      <ContentRow
        title="Sci-Fi & Cyberpunk Worlds"
        subtitle="Futuristic epics, time travel and alternate realities"
        items={sciFiMovies}
        isLoading={loading}
      />

      {/* Action & Adventure */}
      <ContentRow
        title="Action & High-Octane Thrills"
        subtitle="Pulse-pounding stunts and adventures"
        items={actionMovies}
        isLoading={loading}
      />

      {/* Comedy Hits */}
      <ContentRow
        title="Comedy & Entertainment"
        subtitle="Laughs, crowd pleasers and satirical hits"
        items={comedyMovies}
        isLoading={loading}
      />
    </div>
  );
};
