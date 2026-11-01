import React, { useState, useEffect } from 'react';
import { Download, Film, Tv, Play, Trash2, ChevronDown, ChevronUp, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPosterUrl } from '../services/api';
import { listDownloads, removeDownload } from '../services/downloads';
import { DownloadItem, MovieItem } from '../types';

export const DownloadsPage: React.FC = () => {
  const { setActivePlayerMedia } = useAuth();
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'movie' | 'season'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = async () => setItems(await listDownloads());
  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (item: DownloadItem) => {
    await removeDownload(item.id);
    refresh();
  };

  const playMovie = (item: DownloadItem) => {
    const movieItem: MovieItem = {
      id: item.tmdbId,
      title: item.title,
      overview: '',
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average || 0,
      release_date: item.release_date,
      media_type: 'movie',
    };
    setActivePlayerMedia(movieItem);
  };

  const playEpisode = (item: DownloadItem, episodeNumber: number) => {
    const tvItem: MovieItem = {
      id: item.tmdbId,
      name: item.title,
      overview: '',
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average || 0,
      first_air_date: item.release_date,
      media_type: 'tv',
      seasonNumber: item.seasonNumber,
      episodeNumber,
    };
    setActivePlayerMedia(tvItem);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.kind === filter;
  });

  const movieCount = items.filter(i => i.kind === 'movie').length;
  const seasonCount = items.filter(i => i.kind === 'season').length;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E50932] mb-1">
            <Download className="w-4 h-4" />
            <span>In-App Library</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white">
            Downloads
          </h1>
          <p className="text-xs sm:text-sm text-[#A3AAB8] mt-1">
            Movies & seasons saved inside CinePulse — they stay in the app, never on your device.
          </p>
        </div>

        {/* Filter Tabs */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 bg-[#151C2B] p-1 rounded-xl border border-[#273144]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'all' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('movie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'movie' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              Movies ({movieCount})
            </button>
            <button
              onClick={() => setFilter('season')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'season' ? 'bg-[#E50932] text-white shadow' : 'text-[#A3AAB8] hover:text-white'
              }`}
            >
              Seasons ({seasonCount})
            </button>
          </div>
        )}
      </div>

      {/* Grid of Downloads */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map(item => {
            const isExpanded = expanded === item.id;
            return (
              <div
                key={item.id}
                className="relative group/download bg-[#151C2B] rounded-2xl border border-[#273144] overflow-hidden"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] bg-[#101522]">
                  <img
                    src={getPosterUrl(item.poster_path, 'w342')}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513"><rect width="100%" height="100%" fill="%23151C2B"/><text x="50%" y="50%" fill="%23687386" font-family="sans-serif" font-size="16" text-anchor="middle">No Artwork</text></svg>';
                    }}
                  />

                  {/* Kind badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                    {item.kind === 'movie' ? (
                      <Film className="w-3 h-3 text-[#E50932]" />
                    ) : (
                      <Tv className="w-3 h-3 text-[#D6A85F]" />
                    )}
                    <span>{item.kind === 'movie' ? 'Movie' : `S${item.seasonNumber}`}</span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-[#E50932] text-white transition opacity-0 group-hover/download:opacity-100 cursor-pointer shadow-lg"
                    title="Remove download"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Play overlay (movies) */}
                  {item.kind === 'movie' && (
                    <button
                      onClick={() => playMovie(item)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/download:opacity-100 transition cursor-pointer"
                      title={`Play ${item.title}`}
                    >
                      <span className="w-12 h-12 rounded-full bg-[#E50932] flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                      </span>
                    </button>
                  )}

                  {/* Expand button (seasons) */}
                  {item.kind === 'season' && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-[11px] font-semibold text-white cursor-pointer"
                    >
                      <span>{item.episodeCount || item.episodes?.length || 0} episodes</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Meta */}
                <div className="p-3">
                  <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                  <p className="text-[10px] text-[#A3AAB8] mt-0.5 truncate">
                    {item.kind === 'movie'
                      ? new Date(item.downloadedAt).toLocaleDateString()
                      : `${item.seasonName || `Season ${item.seasonNumber}`} • ${item.episodes?.length || item.episodeCount || 0} eps`}
                  </p>
                </div>

                {/* Season episode list */}
                {item.kind === 'season' && isExpanded && item.episodes && item.episodes.length > 0 && (
                  <div className="border-t border-[#273144] max-h-56 overflow-y-auto">
                    {item.episodes.map(ep => (
                      <button
                        key={ep.episode_number}
                        onClick={() => playEpisode(item, ep.episode_number)}
                        className="w-full flex items-center gap-2.5 p-2.5 hover:bg-[#1C2535] transition text-left cursor-pointer"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#1C2535] flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 fill-[#E50932] text-[#E50932]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-white truncate">
                            E{ep.episode_number} — {ep.name}
                          </p>
                          {ep.runtime ? (
                            <p className="text-[10px] text-[#A3AAB8]">{ep.runtime}m</p>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Season quick play */}
                {item.kind === 'season' && (
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => playEpisode(item, 1)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#1C2535] hover:bg-[#273144] text-white text-[11px] font-semibold transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play S{item.seasonNumber} E1</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center text-[#A3AAB8] bg-[#151C2B]/30 rounded-3xl border border-[#273144]/60 max-w-xl mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1C2535] border border-[#273144] flex items-center justify-center mx-auto text-[#687386] mb-4">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-heading text-white">No Downloads Yet</h3>
          <p className="text-xs text-[#A3AAB8] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Open any movie or TV season and hit the <strong className="text-white">Download</strong> button.
            Saved titles live here, inside the app only.
          </p>
        </div>
      )}
    </div>
  );
};
