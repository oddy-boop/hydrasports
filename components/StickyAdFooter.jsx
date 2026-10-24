'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import AdBanner from './AdBanner';
import { adsConfig } from '@/lib/adsConfig';

export default function StickyAdFooter() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !adsConfig.enabled || !adsConfig.slots?.stickyFooter?.enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0c15]/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-center shadow-2xl transition-all">
      <div className="relative w-full max-w-[760px] flex items-center justify-center">
        {/* Close / Dismiss button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute -top-3 right-0 sm:right-2 p-1 rounded-full bg-[#1b192e] hover:bg-white/20 text-slate-400 hover:text-white border border-white/15 shadow-md cursor-pointer transition-colors z-50"
          title="Close Ad"
          aria-label="Close Ad"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="w-full flex justify-center">
          <AdBanner slot="stickyFooter" className="!my-0" />
        </div>
      </div>
    </div>
  );
}
