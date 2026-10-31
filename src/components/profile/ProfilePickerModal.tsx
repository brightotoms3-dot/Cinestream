import React, { useState } from 'react';
import { X, Plus, Edit2, Check, Sparkles, Baby, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiCreateProfile, apiUpdateProfile, apiDeleteProfile } from '../../services/api';
import { UserProfile } from '../../types';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
];

export const ProfilePickerModal: React.FC = () => {
  const { user, activeProfile, setActiveProfile, isProfileModalOpen, setProfileModalOpen } = useAuth();

  const [mode, setMode] = useState<'select' | 'create' | 'edit'>('select');
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  // Form states
  const [profileName, setProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isKids, setIsKids] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState('1080p');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isProfileModalOpen || !user) return null;

  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    setProfileModalOpen(false);
  };

  const handleOpenCreate = () => {
    setProfileName('');
    setSelectedAvatar(AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]);
    setIsKids(false);
    setDefaultQuality('1080p');
    setError('');
    setMode('create');
  };

  const handleOpenEdit = (profile: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setProfileName(profile.name);
    setSelectedAvatar(profile.avatar);
    setIsKids(profile.isKids);
    setDefaultQuality(profile.preferences?.defaultQuality || '1080p');
    setError('');
    setMode('edit');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('Please provide a profile name');
      return;
    }
    setLoading(true);
    try {
      const created = await apiCreateProfile(profileName.trim(), selectedAvatar, isKids);
      user.profiles.push(created);
      setActiveProfile(created);
      setMode('select');
      setProfileModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setLoading(true);
    try {
      const updated = await apiUpdateProfile(editingProfile.id, {
        name: profileName.trim(),
        avatar: selectedAvatar,
        isKids,
        preferences: {
          ...editingProfile.preferences,
          defaultQuality,
        },
      });
      // update local
      const idx = user.profiles.findIndex(p => p.id === editingProfile.id);
      if (idx !== -1) user.profiles[idx] = updated;
      if (activeProfile?.id === editingProfile.id) {
        setActiveProfile(updated);
      }
      setMode('select');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!editingProfile) return;
    if (user.profiles.length <= 1) {
      setError('You must keep at least one profile');
      return;
    }
    setLoading(true);
    try {
      await apiDeleteProfile(editingProfile.id);
      user.profiles = user.profiles.filter(p => p.id !== editingProfile.id);
      if (activeProfile?.id === editingProfile.id) {
        setActiveProfile(user.profiles[0]);
      }
      setMode('select');
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#151C2B] border border-[#273144] rounded-3xl p-6 sm:p-10 shadow-2xl text-[#F5F5F7]">
        {/* Close */}
        <button
          onClick={() => setProfileModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'select' ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Who's Watching?
              </h2>
              <p className="text-xs sm:text-sm text-[#A3AAB8] mt-1">
                Select your profile to view personalized watchlists and continue watching progress.
              </p>
            </div>

            {/* Profile Grid */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
              {user.profiles.map(profile => {
                const isActive = activeProfile?.id === profile.id;
                return (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className="flex flex-col items-center group cursor-pointer relative"
                  >
                    <div className="relative">
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover transition duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-[#E50932] shadow-xl ${
                          isActive ? 'ring-4 ring-[#E50932]' : 'ring-2 ring-[#273144]'
                        }`}
                      />
                      {profile.isKids && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-bold uppercase tracking-wider shadow">
                          Kids
                        </span>
                      )}
                      {/* Edit Button */}
                      <button
                        onClick={e => handleOpenEdit(profile, e)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-[#E50932] text-white transition opacity-0 group-hover:opacity-100"
                        title="Edit profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="mt-3 text-xs sm:text-sm font-semibold text-[#A3AAB8] group-hover:text-white transition">
                      {profile.name}
                    </span>
                  </div>
                );
              })}

              {/* Add Profile Button */}
              {user.profiles.length < 5 && (
                <div
                  onClick={handleOpenCreate}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-[#273144] group-hover:border-[#E50932] flex items-center justify-center text-[#687386] group-hover:text-white transition duration-300 group-hover:scale-105 bg-[#101522]">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-medium text-[#687386] group-hover:text-white transition">
                    Add Profile
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                {mode === 'create' ? 'Create New Profile' : 'Edit Profile Preferences'}
              </h2>
              <p className="text-xs text-[#A3AAB8] mt-1">
                Customize avatar, content restrictions, and playback settings.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={mode === 'create' ? handleCreateSubmit : handleEditSubmit} className="space-y-6">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#A3AAB8] mb-2">Select Avatar</label>
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {AVATAR_OPTIONS.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Avatar option"
                      onClick={() => setSelectedAvatar(img)}
                      className={`w-14 h-14 rounded-xl object-cover cursor-pointer transition ${
                        selectedAvatar === img
                          ? 'ring-4 ring-[#E50932] scale-105'
                          : 'opacity-70 hover:opacity-100 ring-1 ring-[#273144]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Profile Name */}
              <div>
                <label className="block text-xs font-semibold text-[#A3AAB8] mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full bg-[#101522] border border-[#273144] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#687386] focus:outline-none focus:border-[#E50932]"
                />
              </div>

              {/* Kids Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#101522] border border-[#273144]">
                <div className="flex items-center gap-3">
                  <Baby className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Kids Experience</p>
                    <p className="text-[11px] text-[#A3AAB8]">
                      Show only family-friendly titles with age rating G and PG.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isKids}
                  onChange={e => setIsKids(e.target.checked)}
                  className="w-4 h-4 accent-[#E50932] cursor-pointer"
                />
              </div>

              {/* Video Quality Preference */}
              <div>
                <label className="block text-xs font-semibold text-[#A3AAB8] mb-1">
                  Default Streaming Quality
                </label>
                <select
                  value={defaultQuality}
                  onChange={e => setDefaultQuality(e.target.value)}
                  className="w-full bg-[#101522] border border-[#273144] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50932]"
                >
                  <option value="4k">Ultra HD (4K Cinema HDR)</option>
                  <option value="1080p">Full HD (1080p)</option>
                  <option value="720p">Standard HD (720p Data Saver)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-[#E50932] hover:bg-[#cc082c] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('select')}
                    className="px-4 py-2.5 rounded-xl bg-[#1C2535] text-[#A3AAB8] hover:text-white text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>

                {mode === 'edit' && user.profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
