'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, DollarSign, ExternalLink } from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AdBanner({
  slot = 'header',
  className = '',
  customConfig = null,
}) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!adsConfig.enabled) {
    return null;
  }

  const slotConfig = customConfig || adsConfig.slots[slot];
  if (!slotConfig || slotConfig.enabled === false) {
    return null;
  }

  // Dimension presets by slot
  const isSidebar = slot === 'sidebar';
  const isSticky = slot === 'stickyFooter';

  // Has custom ad snippet or image banner?
  const hasHtml = Boolean(slotConfig.html && slotConfig.html.trim().length > 0);
  const hasImage = Boolean(slotConfig.imageBanner?.imageUrl && slotConfig.imageBanner.imageUrl.trim().length > 0);

  // If HTML snippet provided (e.g. Adsterra, Monetag, Google AdSense)
  if (hasHtml) {
    const rawHtml = slotConfig.html;

    return (
      <div className={`ad-slot-wrapper flex flex-col items-center justify-center my-3 w-full ${className}`}>
        <div className="flex items-center gap-1.5 mb-1 opacity-60">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Advertisement
          </span>
        </div>
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-[#12111f] flex items-center justify-center"
          style={{
            width: isSidebar ? '300px' : '100%',
            maxWidth: isSidebar ? '300px' : '728px',
            minHeight: isSidebar ? '250px' : '90px',
          }}
        >
          {mounted && (
            <iframe
              title={`HydraSports Ad - ${slot}`}
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <base target="_blank">
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { 
                        background: transparent; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh;
                        overflow: hidden;
                      }
                    </style>
                  </head>
                  <body>
                    ${rawHtml}
                  </body>
                </html>
              `}
              className="w-full h-full border-0 overflow-hidden"
              style={{
                width: isSidebar ? '300px' : '100%',
                height: isSidebar ? '250px' : '90px',
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // If Image Banner with Affiliate / Referral Link provided
  if (hasImage) {
    const { imageUrl, linkUrl, alt } = slotConfig.imageBanner;
    return (
      <div className={`ad-slot-wrapper flex flex-col items-center justify-center my-3 w-full ${className}`}>
        <div className="flex items-center gap-1.5 mb-1 opacity-60">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Sponsored
          </span>
        </div>
        <a
          href={linkUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#141224] hover:border-purple-500/50 transition-all flex items-center justify-center shadow-lg cursor-pointer"
          style={{
            width: isSidebar ? '300px' : '100%',
            maxWidth: isSidebar ? '300px' : '728px',
            height: isSidebar ? '250px' : '90px',
          }}
        >
          <img
            src={imageUrl}
            alt={alt || 'HydraSports Sponsor'}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3 h-3" />
          </div>
        </a>
      </div>
    );
  }

  // Default Placeholder / Monetization Ready Slot
  // Gives user clean visuals and clear instructions on how to monetize
  const dimensions = isSidebar ? '300 × 250' : '728 × 90';

  return (
    <div className={`ad-slot-wrapper flex flex-col items-center justify-center my-3 w-full ${className}`}>
      <div className="flex items-center justify-between w-full max-w-[728px] px-1 mb-1 opacity-60">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
          <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
          <span>Advertisement Space</span>
        </span>
        <span className="text-[9px] font-mono font-bold text-slate-400">
          {dimensions}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-dashed border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-[#161427]/60 to-purple-950/20 p-3 sm:p-4 flex items-center justify-between shadow-md"
        style={{
          width: isSidebar ? '300px' : '100%',
          maxWidth: isSidebar ? '300px' : '728px',
          minHeight: isSidebar ? '250px' : '70px',
        }}
      >
        {isSidebar ? (
          <div className="flex flex-col items-center justify-center text-center p-3 space-y-3 w-full h-full">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white tracking-wide uppercase">
                Ad Slot (300×250)
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Paste your Adsterra, Monetag, or AdSense code in <code className="text-purple-300 font-mono">lib/adsConfig.js</code>
              </p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Monetization Ready
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wide">
                    {slotConfig.title || 'Leaderboard Ad Space'}
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready to Earn
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400 hidden sm:block mt-0.5">
                  Insert Adsterra, Monetag, or AdSense HTML/script in <code className="text-purple-300 font-mono">lib/adsConfig.js</code>
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 hidden md:inline">
                {dimensions}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
