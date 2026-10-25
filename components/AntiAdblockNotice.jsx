'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink, X, Heart, RefreshCw, CheckCircle2 } from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AntiAdblockNotice() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !adsConfig.enabled) return;

    try {
      if (sessionStorage.getItem('adblock_modal_dismissed') === 'true') {
        setModalDismissed(true);
      }
      if (sessionStorage.getItem('adblock_banner_dismissed') === 'true') {
        setBannerDismissed(true);
      }
    } catch {}

    // Reliable AdBlock Detection: DOM Element Bait + Network Test
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
          // 2. Network Fetch Fallback Test
          fetch('https://czernik.org/14/7fc4610a681ea128cf26b24f9e2fd337', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
          }).catch(() => {
            setAdBlockDetected(true);
          });
        }
      }, 250);
    };

    const timer = setTimeout(runDetection, 600);
    return () => clearTimeout(timer);
  }, []);

  if (!adBlockDetected) return null;

  const handleDismissModal = () => {
    setModalDismissed(true);
    try {
      sessionStorage.setItem('adblock_modal_dismissed', 'true');
    } catch {}
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('adblock_banner_dismissed', 'true');
    } catch {}
  };

  const directLinkUrl = adsConfig.directLink?.url || 'https://dozenfourteen.com/aby98ndqzq?key=02565c0cafd70a97facb82fba589b976';

  return (
    <>
      {/* ── 1. MODAL BARRIER POP-UP (IF NOT DISMISSED) ── */}
      {!modalDismissed && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-[28px] bg-[#141224] border border-purple-500/30 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white flex flex-col space-y-5 relative">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>AdBlock Detected</span>
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Help keep HydraSports 100% free for sports fans
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-300 leading-relaxed bg-[#1b1930] p-3.5 rounded-2xl border border-white/10">
              We provide free live sports streams and real-time scores without charging subscription fees. Our streaming servers are maintained through sponsorships and ads.
            </p>

            {/* Step-by-Step Whitelist Guide */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                How to Pause AdBlock:
              </span>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04]">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>Click the <strong>AdBlock icon</strong> in your browser extension toolbar</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 font-semibold text-white">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Click <strong>"⏸ Pause on this site"</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04]">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                  <span>Click the refresh button below to continue watching!</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>I've Paused AdBlock (Refresh)</span>
              </button>

              <a
                href={directLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#201d36] hover:bg-[#282444] border border-white/15 text-purple-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ Open 4K VIP Mirror</span>
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              </a>
            </div>

            {/* Subtle dismiss option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleDismissModal}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Continue to stream anyway →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 2. TOP BANNER NOTICE (SHOWS AT TOP OF PAGE) ── */}
      {!bannerDismissed && (
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
                AdBlock is active. Please click <strong>"Pause on this site"</strong> or use our VIP mirror to support free match broadcasts!
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
              <span>⚡ Open 4K Mirror</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
