'use client';

import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function FloatingVipPill() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !adsConfig.enabled) return null;

  const url = adsConfig.directLink?.monetagUrl || 'https://uplcm.com/4/12119927';

  return (
    <div className="fixed bottom-20 right-3 z-[65] sm:hidden select-none">
      <div className="relative flex items-center bg-[#141224]/95 backdrop-blur-md rounded-full p-1 border border-emerald-500/40 shadow-[0_10px_25px_rgba(16,185,129,0.35)]">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[11px] tracking-tight active:scale-95 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
          <span>⚡ Switch to 4K Stream</span>
          <ExternalLink className="w-3 h-3 text-emerald-200 shrink-0 ml-0.5" />
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss 4K button"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
