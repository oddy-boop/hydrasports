'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink, X, Heart } from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AntiAdblockNotice() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !adsConfig.enabled) return;
    try {
      if (sessionStorage.getItem('adblock_notice_dismissed') === 'true') return;
    } catch {}

    const checkAdBlock = async () => {
      try {
        // Bait test: test fetching ad network script domain
        await fetch('https://czernik.org/14/7fc4610a681ea128cf26b24f9e2fd337', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
      } catch {
        // If fetch fails or is aborted by browser adblock extension
        setAdBlockDetected(true);
      }
    };

    const timer = setTimeout(checkAdBlock, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!adBlockDetected || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('adblock_notice_dismissed', 'true');
    } catch {}
  };

  const directLinkUrl = adsConfig.directLink?.url || 'https://dozenfourteen.com/aby98ndqzq?key=02565c0cafd70a97facb82fba589b976';

  return (
    <aside aria-label="Ad blocker notice" className="w-full bg-gradient-to-r from-purple-900/40 via-[#18152e] to-purple-900/40 border-b border-purple-500/30 px-3 py-2 text-white text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg animate-fade-in relative z-50">
      <div className="flex items-center gap-2 text-left">
        <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shrink-0 text-purple-300">
          <ShieldAlert className="w-4 h-4 text-purple-300" />
        </div>
        <div>
          <span className="font-extrabold text-white mr-1.5 flex sm:inline items-center gap-1">
            <span>Support Free Live Streaming</span>
            <Heart className="w-3 h-3 text-pink-400 inline fill-pink-400" />
          </span>
          <span className="text-slate-300 text-[11px]">
            We noticed you are using an AdBlocker. HydraSports is 100% free! Please consider whitelisting us or supporting our servers via our VIP fast mirror.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <a
          href={directLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-[11px] shadow-md shadow-purple-600/30 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>⚡ Support & Open 4K Mirror</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss notice"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
