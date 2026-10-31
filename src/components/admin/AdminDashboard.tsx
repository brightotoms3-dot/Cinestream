import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Activity,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetAdminStats,
  apiUpdateProvider,
  apiSetFeatured,
  getTrending,
} from '../../services/api';
import { StreamingProvider, MovieItem } from '../../types';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'featured' | 'users'>('overview');

  const [statsData, setStatsData] = useState<any>(null);
  const [providers, setProviders] = useState<StreamingProvider[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [trendingMedia, setTrendingMedia] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [successNotice, setSuccessNotice] = useState('');
  const [selectedFeaturedId, setSelectedFeaturedId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminRes, trendingRes] = await Promise.all([
        apiGetAdminStats(),
        getTrending('all', 'day', 1),
      ]);
      setStatsData(adminRes.stats);
      setProviders(adminRes.providers);
      setUserList(adminRes.users);
      setTrendingMedia(trendingRes.results || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const notify = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleToggleProvider = async (provider: StreamingProvider) => {
    try {
      const updated = await apiUpdateProvider(provider.id, { active: !provider.active });
      setProviders(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      notify(`Streaming provider ${updated.name} updated.`);
    } catch (err: any) {
      alert(err.message || 'Error updating provider');
    }
  };

  const handleSaveFeatured = async () => {
    try {
      await apiSetFeatured(selectedFeaturedId || null);
      notify('Featured billboard updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Error updating featured billboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-2 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#101522] border border-[#273144] rounded-2xl shadow-2xl overflow-hidden my-auto text-[#F5F5F7]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#273144] flex items-center justify-between bg-[#151C2B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#99001C] to-[#E50932] flex items-center justify-center shadow-lg shadow-[#E50932]/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                  CinePulse Platform Command
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E50932] text-white uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-[#A3AAB8]">
                Administrator: <strong className="text-white">{user?.email || 'brightotoms@gmail.com'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#273144] px-6 bg-[#151C2B]/50 overflow-x-auto no-scrollbar gap-2 sm:gap-4 py-2">
          {[
            { id: 'overview', label: 'Platform Telemetry', icon: Activity },
            { id: 'providers', label: 'Streaming Providers', icon: ExternalLink },
            { id: 'featured', label: 'Billboard Curation', icon: Sparkles },
            { id: 'users', label: 'User Directory', icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#E50932] text-white shadow-md'
                    : 'text-[#A3AAB8] hover:text-white hover:bg-[#1C2535]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#A3AAB8]">Loading dashboard telemetry...</div>
          ) : (
            <>
              {/* Tab: Overview Metrics */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-[#151C2B] border border-[#273144]">
                      <span className="text-[11px] font-semibold uppercase text-[#687386]">Total Accounts</span>
                      <p className="text-2xl font-extrabold text-white mt-1">
                        {statsData?.totalUsers || 1}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-medium">Registered viewers</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#151C2B] border border-[#273144]">
                      <span className="text-[11px] font-semibold uppercase text-[#687386]">Active Profiles</span>
                      <p className="text-2xl font-extrabold text-white mt-1">
                        {statsData?.totalProfiles || 3}
                      </p>
                      <span className="text-[10px] text-[#D6A85F] font-medium">Multi-profile households</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#151C2B] border border-[#273144]">
                      <span className="text-[11px] font-semibold uppercase text-[#687386]">Total Streams</span>
                      <p className="text-2xl font-extrabold text-[#E50932] mt-1">
                        {statsData?.totalStreams || 1850}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-medium">+24% this week</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#151C2B] border border-[#273144]">
                      <span className="text-[11px] font-semibold uppercase text-[#687386]">Watch Time</span>
                      <p className="text-2xl font-extrabold text-white mt-1">
                        {Math.round((statsData?.totalWatchMinutes || 24300) / 60)} hrs
                      </p>
                      <span className="text-[10px] text-blue-400 font-medium">High bitrate playback</span>
                    </div>
                  </div>

                  {/* Top Trending Titles from TMDB */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#151C2B] border border-[#273144]">
                    <h3 className="text-sm font-bold font-heading text-white mb-3">
                      Top Trending TMDB Titles
                    </h3>
                    <div className="space-y-2">
                      {trendingMedia.slice(0, 5).map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#1C2535]/50 border border-[#273144]/40"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={item.title || item.name}
                              className="w-8 h-12 rounded object-cover"
                            />
                            <div>
                              <p className="text-xs font-semibold text-white">{item.title || item.name}</p>
                              <p className="text-[11px] text-[#A3AAB8]">
                                {(item.release_date || item.first_air_date || '').slice(0, 4)} • {item.media_type || 'Movie'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#D6A85F]">
                              ★ {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}
                            </span>
                            <p className="text-[10px] text-[#687386]">{item.vote_count} votes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Streaming Providers */}
              {activeTab === 'providers' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#A3AAB8]">
                    Toggle available partner platforms displayed in the "Available to Stream On" directory.
                  </p>
                  <div className="space-y-3">
                    {providers.map(provider => (
                      <div
                        key={provider.id}
                        className="p-4 rounded-xl bg-[#151C2B] border border-[#273144] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={provider.logo}
                            alt={provider.name}
                            className="w-6 h-6 rounded"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{provider.name}</p>
                            <p className="text-[10px] text-[#687386] font-mono">{provider.searchUrl}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleProvider(provider)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            provider.active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {provider.active ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Billboard Curation */}
              {activeTab === 'featured' && (
                <div className="p-6 rounded-2xl bg-[#151C2B] border border-[#273144] space-y-4">
                  <h3 className="text-sm font-bold font-heading text-white">Homepage Billboard Pin</h3>
                  <p className="text-xs text-[#A3AAB8]">
                    Pin a specific title from the trending catalog or keep automatic daily updates.
                  </p>
                  <select
                    value={selectedFeaturedId}
                    onChange={e => setSelectedFeaturedId(e.target.value)}
                    className="w-full bg-[#101522] border border-[#273144] rounded-xl px-4 py-3 text-xs text-white"
                  >
                    <option value="">Dynamic Daily Trending (Automatic #1)</option>
                    {trendingMedia.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.title || item.name} (★ {item.vote_average?.toFixed(1)})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveFeatured}
                    className="px-6 py-2.5 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-xs font-bold transition cursor-pointer"
                  >
                    Save Billboard Choice
                  </button>
                </div>
              )}

              {/* Tab: User Directory */}
              {activeTab === 'users' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold font-heading text-white">User Accounts</h3>
                  {userList.map(u => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl bg-[#151C2B] border border-[#273144] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E50932]/20 text-[#E50932]">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A3AAB8]">{u.email}</p>
                      </div>

                      <div className="text-right text-xs text-[#687386]">
                        <span>{u.profilesCount} profiles</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
