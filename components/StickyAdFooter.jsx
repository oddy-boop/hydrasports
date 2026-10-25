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
    <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0d0c15]/95 backdrop-blur-md border-t border-purple-500/20 px-2 py-1 flex items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all">
      <div className="relative w-full max-w-[760px] flex items-center justify-center">
        {/* Close / Dismiss button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute -top-3.5 right-1 sm:right-2 p-1 rounded-full bg-[#1c1a2d] hover:bg-white/20 text-slate-300 hover:text-white border border-white/20 shadow-xl cursor-pointer transition-colors z-50 flex items-center justify-center"
          title="Dismiss ad banner"
          aria-label="Dismiss ad banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="w-full flex justify-center overflow-hidden">
          <AdBanner slot="stickyFooter" className="!my-0" />
        </div>
      </div>
    </div>
  );
}
