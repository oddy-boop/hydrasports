'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ExternalLink, 
  Heart, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  X, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AntiAdblockNotice() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [closeClicks, setCloseClicks] = useState(0); // 0 = first click (redirects), 1 = second click (closes)
  const [deviceType, setDeviceType] = useState('desktop'); // 'ios' | 'android' | 'desktop'

  useEffect(() => {
    if (typeof window === 'undefined' || !adsConfig.enabled) return;

    // Detect device type to tailor guidance
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

  // Lock background scroll when the screen overlay is active
  const isOverlayActive = !dismissed && (adBlockDetected || adsConfig.overlayGateway?.enabled);
  useEffect(() => {
    if (isOverlayActive) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOverlayActive]);

  if (!isOverlayActive) return null;

  const directLinkUrl = adsConfig.directLink?.url || 'https://dozenfourteen.com/aby98ndqzq?key=02565c0cafd70a97facb82fba589b976';
  const isMobile = deviceType === 'ios' || deviceType === 'android';

  // 2-Step Close Handler: Click 1 redirects to SmartLink in new tab; Click 2 closes the overlay
  const handleCloseClick = (e) => {
    if (e) e.preventDefault();
    if (closeClicks === 0) {
      try {
        window.open(directLinkUrl, '_blank', 'noopener,noreferrer');
      } catch {}
      setCloseClicks(1);
    } else {
      setDismissed(true);
    }
  };

  return (
    <>
      {/* ── FULL SCREEN OVERLAY GATEWAY ON REFRESH (1st click redirects, 2nd click closes) ── */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="adblock-modal-title"
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl animate-fade-in select-none"
      >
        <div className="w-full max-w-lg rounded-[26px] bg-[#141224] border-2 border-purple-500/40 p-5 sm:p-7 shadow-[0_25px_80px_rgba(147,51,234,0.35)] text-white flex flex-col space-y-4 sm:space-y-5 relative max-h-[92vh] overflow-y-auto">
          
          {/* Top-Right 2-Step Close Button (✕) */}
          <button
            type="button"
            onClick={handleCloseClick}
            className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-xl border shadow-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 z-50 ${
              closeClicks === 0
                ? 'bg-[#1f1c39] hover:bg-[#2a264e] text-slate-300 hover:text-white border-white/15'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 animate-pulse'
            }`}
            aria-label="Close"
            title={closeClicks === 0 ? "Click to close" : "Click again to close"}
          >
            {closeClicks === 0 ? (
              <X className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1 px-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10.5px] font-black uppercase">Close (2/2)</span>
                <X className="w-3.5 h-3.5" />
              </div>
            )}
          </button>

          {/* Header */}
          {adBlockDetected ? (
            <div className="flex items-center gap-3 pr-10">
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
          ) : (
            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-emerald-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-600/30">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h2 id="adblock-modal-title" className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>HydraSports 4K Live Pass</span>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                </h2>
                <p className="text-[11px] sm:text-xs text-purple-300 font-semibold mt-0.5">
                  Free HD Stadium Broadcast Feeds • 1080p 60FPS
                </p>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="text-xs text-slate-200 leading-relaxed bg-[#1b1932] p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-1">
            <p className="font-bold text-white text-xs sm:text-[13px]">
              {adBlockDetected 
                ? 'HydraSports stadium servers are paid for by advertising sponsors.' 
                : 'Welcome to HydraSports! Free live stream access is sponsored by our partners.'}
            </p>
            <p className="text-slate-400 text-[11px] sm:text-xs">
              {adBlockDetected 
                ? 'Please pause your ad blocker for HydraSports or use the close button below to unlock your stream.' 
                : 'Click continue below to enter your live match stream and view stadium broadcasts.'}
            </p>
          </div>

          {/* Step-by-Step Instructions if AdBlock is active */}
          {adBlockDetected && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  {isMobile ? <Smartphone className="w-3.5 h-3.5 text-purple-400" /> : <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{deviceType === 'ios' ? 'iPhone / iPad Safari' : deviceType === 'android' ? 'Mobile Browser' : 'Desktop Browser'} Guide:</span>
                </span>
              </div>

              {deviceType === 'ios' ? (
                <div className="space-y-1.5 text-xs text-slate-200">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Tap the <strong>aA</strong> icon in Safari's address bar ➔ <strong>"Turn Off Content Blockers"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Or click <strong>Continue to Free Live Stream</strong> below to unlock access!</span>
                  </div>
                </div>
              ) : deviceType === 'android' ? (
                <div className="space-y-1.5 text-xs text-slate-200">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <span><strong>Brave:</strong> Tap orange Lion icon ➔ turn Shields OFF. <strong>Samsung:</strong> ☰ menu ➔ Ad blockers.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Or click <strong>Continue to Free Live Stream</strong> below to bypass and stream directly!</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0">1</span>
                    <span>Click your <strong>AdBlock icon</strong> in browser bar ➔ <strong>⏸ Pause on this site</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0">2</span>
                    <span>Or click <strong>Continue to Free Live Stream</strong> below to enter!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2-Step Action Buttons: 1st click redirects to Smartlink, 2nd click closes */}
          <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleCloseClick}
              className={`w-full sm:flex-1 py-3 sm:py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 ${
                closeClicks === 0
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/40 animate-pulse'
              }`}
            >
              {closeClicks === 0 ? (
                <>
                  <span>Continue to Free Live Stream →</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Click to Enter Live Stream ✕</span>
                </>
              )}
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

          {/* Quick reload alternative for adblock users */}
          {adBlockDetected && (
            <div className="flex items-center justify-center pt-0.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>I've Paused AdBlock (Reload Page)</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}