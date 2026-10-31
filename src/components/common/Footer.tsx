import React, { useState } from 'react';
import { Film, HelpCircle, FileText, Lock, Mail, Play, Sparkles, X } from 'lucide-react';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <footer className="bg-[#080B12] border-t border-[#273144] pt-12 pb-24 md:pb-12 text-[#A3AAB8] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#99001C] via-[#E50932] to-[#FF3358] flex items-center justify-center shadow-lg shadow-[#E50932]/30">
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              </div>
              <span className="font-heading font-extrabold text-lg text-white">
                CINE<span className="text-[#E50932]">PULSE</span>
              </span>
            </div>
            <p className="text-xs text-[#687386] leading-relaxed max-w-sm">
              CinePulse brings you the ultimate entertainment streaming hub powered by The Movie Database (TMDB) API, with personalized profiles, continuous playback, and real-time movie intelligence.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-[#D6A85F]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full HD Streaming • Live Catalogs • Multi-Profile Sync</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition">Trending Today</button></li>
              <li><button onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })} className="hover:text-white transition">Popular Movies</button></li>
              <li><button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="hover:text-white transition">TV Series Catalog</button></li>
              <li><button onClick={() => window.scrollTo({ top: 1200, behavior: 'smooth' })} className="hover:text-white transition">Top Rated Classics</button></li>
            </ul>
          </div>

          {/* Platform & Legal */}
          <div>
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Platform & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveModal('about')} className="hover:text-white transition flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-[#E50932]" />
                  <span>About CinePulse</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveModal('terms')} className="hover:text-white transition flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-[#A3AAB8]" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#A3AAB8]" />
                  <span>Privacy Policy</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveModal('help')} className="hover:text-white transition flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3 text-[#687386]" />
                  <span>Help Centre</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveModal('contact')} className="hover:text-white transition flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#687386]" />
                  <span>Contact Operations</span>
                </button>
              </li>
              <li>
                <span className="text-[#687386]">Device Compatibility: Android & Web</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="pt-8 border-t border-[#273144] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#687386]">
          <p>© {new Date().getFullYear()} CinePulse Entertainment Network. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Powered by The Movie Database (TMDB) API</span>
            <span>•</span>
            <span>Multi-Device PWA Enabled</span>
          </div>
        </div>
      </div>

      {/* Info Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#151C2B] border border-[#273144] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F5F5F7]">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#A3AAB8] hover:text-white hover:bg-[#1C2535] transition"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'about' && (
              <div>
                <h3 className="text-xl font-bold font-heading text-white mb-3">About CinePulse</h3>
                <p className="text-xs text-[#A3AAB8] leading-relaxed">
                  CinePulse delivers a seamless cinema and television experience. Featuring live synchronization with The Movie Database (TMDB), personalized multi-profile accounts, curated collections, and responsive playback across mobile and desktop.
                </p>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <h3 className="text-xl font-bold font-heading text-white mb-3">Terms of Service</h3>
                <p className="text-xs text-[#A3AAB8] leading-relaxed">
                  By using CinePulse, you agree to utilize the platform for personal entertainment in accordance with applicable guidelines. Playback progress and preferences are synchronized to your account profile.
                </p>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div>
                <h3 className="text-xl font-bold font-heading text-white mb-3">Privacy Policy</h3>
                <p className="text-xs text-[#A3AAB8] leading-relaxed">
                  We respect your privacy. CinePulse stores account preferences, profile avatars, continue watching timestamps, and watchlists strictly for the purpose of personalizing your experience.
                </p>
              </div>
            )}

            {activeModal === 'help' && (
              <div>
                <h3 className="text-xl font-bold font-heading text-white mb-3">Help Centre</h3>
                <div className="text-xs text-[#A3AAB8] space-y-3">
                  <div>
                    <h5 className="font-semibold text-white">How do I stream movies?</h5>
                    <p>Click Play on any movie or series to launch the full-screen player with speed controls, subtitles, and picture-in-picture.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">Can I install this on my Android phone?</h5>
                    <p>Yes, click the 'Install App' button in the top navigation bar to add CinePulse directly to your home screen.</p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'contact' && (
              <div>
                <h3 className="text-xl font-bold font-heading text-white mb-3">Contact Support</h3>
                <p className="text-xs text-[#A3AAB8] leading-relaxed">
                  For platform questions or technical inquiries, contact our team at:
                </p>
                <p className="text-sm font-semibold text-[#E50932] mt-3">support@cinepulse.io</p>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
