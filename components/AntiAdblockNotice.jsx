'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink, Heart, RefreshCw } from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AntiAdblockNotice() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !adsConfig.enabled) return;

    // Strict AdBlock Detection: DOM Element Bait + Network Test
    const runDetection = () => {
      let isBlocked = false;

      // 1. DOM Bait Test (EasyList CSS filter detection)
      const bait = document.createElement('div');
      bait.className = 'ad-banner adsbox pub_300x250 pub_728x90 text-ad textAd text_ad text-ads banner-ad';
      bait.setAttribute('aria-hidden', 'true');
      bait.style.position = 'absolute';
      bait.style.left = '-10000px';
      bait.style.top = '-1000px';
      bait.style.width = '10px';
      bait.style.height = '10px';
      document.body.appendChild(bait);

      setTimeout(() => {
        try {
          const style = window.getComputedStyle(bait);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            bait.offsetParent === null ||
            bait.offsetHeight === 0 ||
            bait.clientHeight === 0
          ) {
            isBlocked = true;
          }
        } catch {}

        if (bait.parentNode) {
          bait.parentNode.removeChild(bait);
        }

        if (isBlocked) {
          setAdBlockDetected(true);
        } else {
          // 2. Network Fetch Fallback Tests
          // Dual check: Google AdSense tag + Adsterra tag (100% blocked by AdBlock, uBlock, Brave Shields)
          fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
          }).catch(() => {
            setAdBlockDetected(true);
          });

          fetch('https://czernik.org/14/7fc4610a681ea128cf26b24f9e2fd337', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
          }).catch(() => {
            setAdBlockDetected(true);
          });
        }
      }, 200);
    };

    const timer = setTimeout(runDetection, 300);
    return () => clearTimeout(timer);
  }, []);

  // Lock background scroll when AdBlock is detected
  useEffect(() => {
    if (adBlockDetected) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [adBlockDetected]);

  if (!adBlockDetected) return null;

  const directLinkUrl = adsConfig.directLink?.url || 'https://dozenfourteen.com/aby98ndqzq?key=02565c0cafd70a97facb82fba589b976';

  return (
    <>
      {/* ── STRICT ENFORCED ANTI-ADBLOCK MODAL BARRIER ── */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="adblock-modal-title"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in select-none"
      >
        <div className="w-full max-w-lg rounded-[28px] bg-[#141224] border-2 border-purple-500/40 p-6 md:p-8 shadow-[0_25px_80px_rgba(147,51,234,0.35)] text-white flex flex-col space-y-5 relative">
          
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-600/30">
              <ShieldAlert className="w-7 h-7 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h2 id="adblock-modal-title" className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>AdBlock Detected</span>
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              </h2>
              <p className="text-xs text-purple-300 font-semibold mt-0.5">
                Action Required to Watch Free Sports Streams
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-slate-200 leading-relaxed bg-[#1b1932] p-4 rounded-2xl border border-white/10 space-y-1.5">
            <p className="font-bold text-white">
              HydraSports provides free high-definition live streams with zero subscription fees.
            </p>
            <p className="text-slate-400 text-[11.5px]">
              Our streaming bandwidth and stadium feeds are paid for by advertising sponsors. Please pause AdBlock on HydraSports to access live matches.
            </p>
          </div>

          {/* Step-by-Step Whitelist Instructions */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
              How to Unlock HydraSports in 10 Seconds:
            </span>
            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                <span className="w-6 h-6 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-xs shrink-0">1</span>
                <span>Click the <strong>AdBlock icon</strong> in your browser extension toolbar</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-600/25 border border-purple-500/40 font-bold text-white shadow-sm">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">2</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span>Click</span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/20 font-black text-amber-300">
                    ⏸ Pause on this site
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                <span className="w-6 h-6 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-xs shrink-0">3</span>
                <span>Click the button below to reload and watch the game!</span>
              </div>
            </div>
          </div>

          {/* Enforced Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>I've Paused AdBlock (Refresh)</span>
            </button>

            <a
              href={directLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#221f3a] hover:bg-[#2b2749] border border-purple-500/30 text-purple-300 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>⚡ Open 4K VIP Mirror</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
