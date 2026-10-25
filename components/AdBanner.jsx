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

  const slotConfig = customConfig || adsConfig.slots[slot];

  // Dimension presets by slot
  const isSidebar = slot === 'sidebar';
  const isSticky = slot === 'stickyFooter';

  // Has custom ad snippet or image banner?
  const hasHtml = Boolean(slotConfig?.html && slotConfig.html.trim().length > 0);
  const hasImage = Boolean(slotConfig?.imageBanner?.imageUrl && slotConfig.imageBanner.imageUrl.trim().length > 0);
  const rawHtml = slotConfig?.html || '';

  // Dynamically inject ad iframe with proper page origin/referer for Adsterra/Monetag
  useEffect(() => {
    if (!mounted || !containerRef.current || !hasHtml) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.title = `HydraSports Ad - ${slot}`;
    iframe.width = isSidebar ? '300' : '728';
    iframe.height = isSidebar ? '250' : '90';
    iframe.style.width = isSidebar ? '300px' : '728px';
    iframe.style.height = isSidebar ? '250px' : '90px';
    iframe.style.maxWidth = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.setAttribute('scrolling', 'no');

    container.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="referrer" content="no-referrer-when-downgrade">
              <base href="${typeof window !== 'undefined' ? window.location.href : 'https://hydrasports.selamate.com'}" target="_blank">
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
        `);
        doc.close();
      }
    } catch (err) {
      console.error('Failed to inject ad banner iframe:', err);
    }
  }, [mounted, hasHtml, rawHtml, isSidebar, slot]);

  if (!adsConfig.enabled) {
    return null;
  }

  if (!slotConfig || slotConfig.enabled === false) {
    return null;
  }

  // If HTML snippet provided (e.g. Adsterra, Monetag, Google AdSense)
  if (hasHtml) {
    return (
      <div className={`ad-slot-wrapper flex flex-col items-center justify-center ${isSticky ? 'my-0' : 'my-2 sm:my-3'} w-full ${className}`}>
        {!isSticky && (
          <div className="flex items-center gap-1.5 mb-1 opacity-60">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Advertisement
            </span>
          </div>
        )}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-[#12111f] flex items-center justify-center"
          style={{
            width: isSidebar ? '300px' : '100%',
            maxWidth: isSidebar ? '300px' : '728px',
            minHeight: isSidebar ? '250px' : '90px',
            height: isSidebar ? '250px' : '90px',
          }}
        />
      </div>
    );
  }

  // If Image Banner with Affiliate / Referral Link provided
  if (hasImage) {
    const { imageUrl, linkUrl, alt } = slotConfig.imageBanner;
    return (
      <div className={`ad-slot-wrapper flex flex-col items-center justify-center ${isSticky ? 'my-0' : 'my-2 sm:my-3'} w-full ${className}`}>
        {!isSticky && (
          <div className="flex items-center gap-1.5 mb-1 opacity-60">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Sponsored
            </span>
          </div>
        )}
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
  const dimensions = isSidebar ? '300 × 250' : '728 × 90';

  return (
    <div className={`ad-slot-wrapper flex flex-col items-center justify-center ${isSticky ? 'my-0' : 'my-2 sm:my-3'} w-full ${className}`}>
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
