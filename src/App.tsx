import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { StreamingPlayerModal } from './components/player/StreamingPlayerModal';
import { DetailModal } from './components/details/DetailModal';
import { AuthModal } from './components/auth/AuthModal';
import { ProfilePickerModal } from './components/profile/ProfilePickerModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { TVShowsPage } from './pages/TVShowsPage';
import { NewPopularPage } from './pages/NewPopularPage';
import { MyListPage } from './pages/MyListPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { SearchPage } from './pages/SearchPage';
import { MovieItem } from './types';

const StreamingApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'movies' | 'tv' | 'new' | 'watchlist' | 'downloads' | 'search'>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const {
    activePlayerMedia,
    setActivePlayerMedia,
    activeDetailMedia,
    setActiveDetailMedia,
  } = useAuth();

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSearch = () => {
    setCurrentTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F5F5F7] flex flex-col font-sans selection:bg-[#E50932] selection:text-white">
      {/* Top Navbar & Mobile Bottom Nav */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={handleOpenSearch}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Pages */}
      <main className="flex-1">
        {currentTab === 'home' && <HomePage />}
        {currentTab === 'movies' && <MoviesPage />}
        {currentTab === 'tv' && <TVShowsPage />}
        {currentTab === 'new' && <NewPopularPage />}
        {currentTab === 'watchlist' && <MyListPage />}
        {currentTab === 'downloads' && <DownloadsPage />}
        {currentTab === 'search' && <SearchPage />}
      </main>

      {/* Cinematic Footer */}
      <Footer />

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />

      {/* Streaming Player Modal */}
      {activePlayerMedia && (
        <StreamingPlayerModal
          movie={activePlayerMedia}
          onClose={() => setActivePlayerMedia(null)}
        />
      )}

      {/* Movie & TV Detail Modal */}
      {activeDetailMedia && (
        <DetailModal
          movie={activeDetailMedia}
          onClose={() => setActiveDetailMedia(null)}
          onPlay={(movie: MovieItem) => {
            setActivePlayerMedia(movie);
          }}
        />
      )}

      {/* Authentication & Registration Modal */}
      <AuthModal />

      {/* Profile Switcher & Manager Modal */}
      <ProfilePickerModal />

      {/* Protected Admin Console */}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StreamingApp />
    </AuthProvider>
  );
}
