'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  ShieldAlert, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  X, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { adsConfig } from '@/lib/adsConfig';

export default function AntiAdblockNotice() {
  const pathname = usePathname() || '';
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [closeClicks, setCloseClicks] = useState(0); // 0 = first click (redirects), 1 = second click (closes)
  const [deviceType, setDeviceType] = useState('desktop'); // 'ios' | 'android' | 'desktop'
  const isCheckingRef = useRef(false);

  // Detect device type
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
    } else if (/Android|Mobi/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  // Aggressive AdBlock Detection Engine
  const runDetection = useCallback(async () => {
    if (typeof window === 'undefined' || isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);

    let isBlocked = false;

    try {
      // 1. DOM Bait Test (EasyList CSS hiding rule detection with multiple triggers)
      const bait = document.createElement('div');
      bait.className = 'ad-banner adsbox pub_300x250 pub_728x90 text-ad textAd text_ad text-ads banner-ad ad-slot ad-unit google-ad';
      bait.setAttribute('aria-hidden', 'true');
      bait.style.position = 'absolute';
      bait.style.left = '-10000px';
      bait.style.top = '-1000px';
      bait.style.width = '10px';
      bait.style.height = '10px';
      bait.innerHTML = '&nbsp;';
      document.body.appendChild(bait);

      // Give browser layout engine a tick to apply element hiding rules
      await new Promise(r => setTimeout(r, 100));

      const style = window.getComputedStyle(bait);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0
      ) {
        isBlocked = true;
      }

      if (bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }

      // 2. Brave Browser Shields Detection
      if (!isBlocked && (navigator).brave) {
        try {
          const isBrave = await (navigator).brave.isBrave();
          if (isBrave) {
            // Check if Brave Shields are blocking Google / Adsterra scripts
            try {
              await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
              });
            } catch {
              isBlocked = true;
            }
          }
        } catch {}
      }

      // 3. Network Fetch Fallback Test: Check Google AdSense / DoubleClick
      if (!isBlocked && navigator.onLine) {
        try {
          await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
          });
        } catch {
          isBlocked = true;
        }
      }

      // 4. Adsterra / Sponsor Network Host Check
      if (!isBlocked && navigator.onLine) {
        try {
          await fetch('https://czernik.org/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
          });
        } catch {
          // If czernik is blocked by network filters, flag as blocked
          isBlocked = true;
        }
      }
    } catch {
      // In case of unexpected check exception
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
      setAdBlockDetected(isBlocked);
    }
  }, []);

  // Initial detection and periodic re-check
  useEffect(() => {
    if (typeof window === 'undefined' || !adsConfig.enabled) return;

    // Check frequency cooldown for standard promotional overlay (NOT adblock stopper)
    try {
      const lastShown = localStorage.getItem('hydra_overlay_last_shown');
      const cooldownMinutes = adsConfig.overlayGateway?.frequencyMinutes ?? 60;
      const cooldownMs = cooldownMinutes * 60 * 1000;
      if (lastShown && Date.now() - parseInt(lastShown, 10) < cooldownMs) {
        setDismissed(true);
      }
    } catch {}

    // Run initial aggressive adblock detection
    const initialTimer = setTimeout(runDetection, 250);

    // Continuous background re-check every 3 seconds
    // Automatically dismisses the stopper wall the moment the user pauses AdBlock!
    const interval = setInterval(runDetection, 3000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [runDetection]);

  // Aggressive Ad-Shield Stopper is active if AdBlock is detected ANYWHERE (including watch pages)
  // Or standard frequency-capped promotional gateway is active on browse pages
  const isWatchPage = pathname.startsWith('/watch/') || pathname.startsWith('/multistream');
  const isStopperActive = adBlockDetected || (!isWatchPage && !dismissed && adsConfig.overlayGateway?.enabled);

  useEffect(() => {
    if (isStopperActive) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isStopperActive]);

  if (!isStopperActive) return null;

  // 50/50 Traffic Split between Adsterra and Monetag Direct Links
  const directLinkUrl = Math.random() < 0.5
    ? (adsConfig.directLink?.url || 'https://dozenfourteen.com/uh5cgsk2r?key=f62dcc4c1c418b2d8ce632ca9391d1f8')
    : (adsConfig.directLink?.monetagUrl || 'https://uplcm.com/4/12119927');
  const isMobile = deviceType === 'ios' || deviceType === 'android';

  // Handler for standard promotional overlay (only available when AdBlock is NOT detected)
  const handlePromoCloseClick = (e) => {
    if (e) e.preventDefault();
    if (adBlockDetected) return; // Cannot bypass while AdBlock is active!

    if (closeClicks === 0) {
      try {
        window.open(directLinkUrl, '_blank', 'noopener,noreferrer');
      } catch {}
      setCloseClicks(1);
    } else {
      setDismissed(true);
      try {
        localStorage.setItem('hydra_overlay_last_shown', Date.now().toString());
      } catch {}
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-modal-title"
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fade-in select-none"
    >
      <div className={`w-full max-w-lg rounded-[28px] bg-[#141224] border-2 ${adBlockDetected ? 'border-red-500/50 shadow-[0_25px_90px_rgba(239,68,68,0.35)]' : 'border-purple-500/40 shadow-[0_25px_80px_rgba(147,51,234,0.35)]'} p-5 sm:p-7 text-white flex flex-col space-y-4 sm:space-y-5 relative max-h-[92vh] overflow-y-auto`}>
        
        {/* Top-Right Close Button: ONLY visible for regular promo pass, LOCKED when AdBlock is detected */}
        {!adBlockDetected && (
          <button
            type="button"
            onClick={handlePromoCloseClick}
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
        )}

        {/* ── HEADER ── */}
        {adBlockDetected ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-600/30 animate-pulse">
              <ShieldAlert className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="adblock-modal-title" className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  AdBlock Detected
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider">
                  Access Paused
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-300 font-semibold mt-0.5">
                Disable or pause your ad blocker to watch live football
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

        {/* ── EXPLANATION BANNER ── */}
        <div className={`text-xs leading-relaxed p-3.5 sm:p-4 rounded-2xl border space-y-1.5 ${adBlockDetected ? 'bg-red-950/30 border-red-500/30 text-slate-200' : 'bg-[#1b1932] border-white/10 text-slate-200'}`}>
          <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-[13px]">
            {adBlockDetected && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>
              {adBlockDetected 
                ? 'HydraSports is 100% free with ZERO monthly subscriptions.' 
                : 'Welcome to HydraSports! Free live stream access is sponsored by our partners.'}
            </span>
          </div>
          <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed">
            {adBlockDetected 
              ? 'Our high-bandwidth sports servers are paid for by advertising sponsors. Because an ad blocker is preventing sponsor ads from loading, streaming access is paused. Please pause your ad blocker for this site, then click "Check Again".' 
              : 'Click continue below to enter your live match stream and view stadium broadcasts.'}
          </p>
        </div>

        {/* ── PLATFORM-SPECIFIC UNBLOCK INSTRUCTIONS (When AdBlock is Active) ── */}
        {adBlockDetected && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                {isMobile ? <Smartphone className="w-3.5 h-3.5 text-purple-400" /> : <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                <span>How to pause your ad blocker ({deviceType === 'ios' ? 'iOS' : deviceType === 'android' ? 'Android' : 'Desktop'}):</span>
              </span>
            </div>

            {deviceType === 'ios' ? (
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-red-600/40 text-red-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>aA</strong> or settings icon in Safari's address bar ➔ <strong>"Turn Off Content Blockers"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Once paused, tap the <strong>"Check Again"</strong> button below to instantly resume your stream!</span>
                </div>
              </div>
            ) : deviceType === 'android' ? (
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-red-600/40 text-red-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span><strong>Brave:</strong> Tap the orange Lion icon ➔ Toggle <strong>Shields DOWN</strong>. <strong>Samsung/Chrome:</strong> Menu ➔ Disable AdBlock.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Tap <strong>"Check Again"</strong> below to unlock the stream.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-red-600/40 text-red-300 font-black flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Click your <strong>AdBlock / uBlock / Brave Lion</strong> icon in browser bar ➔ <strong>⏸ Pause on this site</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-black flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Click <strong>"Check Again (I've Paused AdBlock)"</strong> below to unlock instantly!</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          {adBlockDetected ? (
            /* AdBlock is ON: User MUST check again to verify AdBlock is paused */
            <button
              type="button"
              onClick={runDetection}
              disabled={isChecking}
              className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying AdBlock Status...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Check Again (I've Paused AdBlock)</span>
                </>
              )}
            </button>
          ) : (
            /* Regular Promo Pass (No AdBlock): 2-Step Continue */
            <button
              type="button"
              onClick={handlePromoCloseClick}
              className={`w-full sm:flex-1 py-3 sm:py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 ${
                closeClicks === 0
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/40 animate-pulse'
              }`}
            >
              {closeClicks === 0 ? (
                <span>Continue to Free Live Stream →</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Click to Enter Live Stream ✕</span>
                </>
              )}
            </button>
          )}

          {/* Secondary CTA: Direct Sponsor VIP Mirror */}
          <a
            href={directLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 sm:py-3.5 px-4 rounded-xl bg-[#221f3a] hover:bg-[#2b2749] border border-purple-500/30 text-purple-300 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 text-center"
          >
            <span>⚡ Open VIP 4K Server</span>
            <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          </a>
        </div>

        {/* Reload button helper */}
        <div className="flex items-center justify-center pt-0.5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload Entire Page</span>
          </button>
        </div>

      </div>
    </div>
  );
}
