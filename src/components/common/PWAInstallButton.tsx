import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-[#1C2535] hover:bg-[#E50932] border border-[#273144] hover:border-[#E50932] px-3.5 py-1.5 text-xs font-semibold text-[#F5F5F7] shadow-sm transition-all duration-200 cursor-pointer"
        title="Install CinePulse app on your device"
      >
        <Download className="w-3.5 h-3.5 text-[#E50932] group-hover:text-white" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-[#1C2535] hover:bg-[#273144] border border-[#273144] px-3 py-1 text-xs font-medium text-[#F5F5F7] transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#D6A85F]" />
          <span className="hidden sm:inline">Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#151C2B] border border-[#273144] p-6 shadow-2xl relative text-[#F5F5F7]">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-[#A3AAB8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold font-heading text-white">Install on iPhone / iPad</h3>
              <p className="mt-3 text-sm text-[#A3AAB8] leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> button in the Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.<br />
                3. Enjoy CinePulse in full-screen cinema mode!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#E50932] hover:bg-[#cc082c] py-2.5 text-sm font-semibold text-white transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
