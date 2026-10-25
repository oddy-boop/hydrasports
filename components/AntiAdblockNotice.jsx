'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink, Heart, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AntiAdblockNotice() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop'); // 'ios' | 'android' | 'desktop'

  useEffect(() => {
    if (typeof window === 'undefined' || !adsConfig.enabled) return;

    // Detect mobile device to tailor whitelist instructions
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
    } else if (/Android/.test(ua)) {
      setDeviceType('android');
    } else if (/Mobi/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Strict AdBlock Detection: DOM Element Bait + Network Test
    const runDetection = () => {
      let isBlocked = false;

      // 1. DOM Bait Test (EasyList CSS hiding rule detection)
      const bait = document.createElement('div');
      bait.className = 'ad-banner adsbox pub_300x250 pub_728x90 text-ad textAd text_ad text-ads banner-ad';
      bait.setAttribute('aria-hidden', 'true');
      bait.style.position = 'absolute';
      bait.style.left = '-10000px';
      bait.style.top = '-1000px';
      bait.style.width = '10px';
      bait.style.height = '10px';
      bait.innerHTML = '&nbsp;';
      document.body.appendChild(bait);

      setTimeout(() => {
        try {
          const style = window.getComputedStyle(bait);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
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
        } else if (navigator.onLine) {
          // 2. Network Fetch Fallback Test: Check Google AdSense (blocked universally by mobile Brave Shields, AdGuard, Pi-hole)
          fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
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
  const isMobile = deviceType === 'ios' || deviceType === 'android';

  return (
    <>
      {/* ── STRICT ENFORCED ANTI-ADBLOCK MODAL BARRIER ── */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="adblock-modal-title"
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl animate-fade-in select-none"
      >
        <div className="w-full max-w-lg rounded-[26px] bg-[#141224] border-2 border-purple-500/40 p-5 sm:p-7 shadow-[0_25px_80px_rgba(147,51,234,0.35)] text-white flex flex-col space-y-4 sm:space-y-5 relative max-h-[92vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-600/30">
              <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h2 id="adblock-modal-title" className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>AdBlock Detected</span>
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 fill-pink-400" />
              </h2>
              <p className="text-[11px] sm:text-xs text-purple-300 font-semibold mt-0.5">
                Support free live sports streaming with zero subscriptions
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-slate-200 leading-relaxed bg-[#1b1932] p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-1">
            <p className="font-bold text-white text-xs sm:text-[13px]">
              HydraSports stadium servers are paid for by advertising sponsors.
            </p>
            <p className="text-slate-400 text-[11px] sm:text-xs">
              Please pause your ad blocker for HydraSports or use our VIP mirror to start watching immediately.
            </p>
          </div>

          {/* Step-by-Step Instructions tailored to Desktop vs iOS vs Android */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                {isMobile ? <Smartphone className="w-3.5 h-3.5 text-purple-400" /> : <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                <span>{deviceType === 'ios' ? 'iPhone / iPad Safari' : deviceType === 'android' ? 'Mobile Browser' : 'Desktop Browser'} Guide:</span>
              </span>
            </div>

            {deviceType === 'ios' ? (
              /* iOS Safari instructions */
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>aA</strong> or <strong>puzzle icon</strong> on the left side of Safari's address bar.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-600/25 border border-purple-500/40 font-bold text-white shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Tap <strong>"Turn Off Content Blockers"</strong> (or check <em>Settings → Safari → Extensions</em>).</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Reload</strong> below, or tap <strong>⚡ Open 4K VIP Mirror</strong> to stream without changing settings!</span>
                </div>
              </div>
            ) : deviceType === 'android' ? (
              /* Android / Mobile Browser instructions */
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span><strong>Brave:</strong> Tap the orange <strong>Lion icon</strong> in the address bar & turn Shields <strong>OFF</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-600/25 border border-purple-500/40 font-bold text-white shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span><strong>Samsung Internet / Chrome:</strong> Tap <strong>☰ menu</strong> → <strong>Ad blockers</strong> or pause your AdGuard/DNS app.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Or tap <strong>⚡ Open 4K VIP Mirror</strong> below to start streaming directly!</span>
                </div>
              </div>
            ) : (
              /* Desktop Browser instructions */
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Click your <strong>AdBlock / uBlock icon</strong> in the browser extension bar</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-600/25 border border-purple-500/40 font-bold text-white shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span>Click</span>
                    <span className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/20 font-black text-amber-300">
                      ⏸ Pause on this site
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>Click reload or switch to our 4K VIP mirror below</span>
                </div>
              </div>
            )}
          </div>

          {/* Enforced Action Buttons */}
          <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:flex-1 py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>I've Paused AdBlock (Reload)</span>
            </button>

            <a
              href={directLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 sm:py-3.5 px-4 rounded-xl bg-[#221f3a] hover:bg-[#2b2749] border border-purple-500/30 text-purple-300 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 text-center"
            >
              <span>⚡ Open 4K VIP Mirror</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
