'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Grip, Maximize2, X, Radio } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import StreamPlayer from './StreamPlayer';

const MiniPlayerContext = createContext(null);

export function MiniPlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [position, setPosition] = useState({ right: 16, bottom: 16 });
  const dragRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mini_player_position') || 'null');
      if (saved && Number.isFinite(saved.right) && Number.isFinite(saved.bottom)) {
        setPosition(saved);
      }
    } catch {}
  }, []);

  const startDrag = useCallback((event) => {
    if (event.button !== 0) return;
    if (event.target.closest('a, button')) return;
    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      right: position.right,
      bottom: position.bottom,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [position]);

  const moveDrag = useCallback((event) => {
    if (!dragRef.current) return;
    const drag = dragRef.current;
    const playerWidth = Math.min(360, window.innerWidth - 32);
    const playerHeight = 260;
    const right = Math.max(16, Math.min(window.innerWidth - playerWidth - 16, drag.right - (event.clientX - drag.startX)));
    const bottom = Math.max(16, Math.min(window.innerHeight - playerHeight - 16, drag.bottom - (event.clientY - drag.startY)));
    setPosition({ right, bottom });
  }, []);

  const stopDrag = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      localStorage.setItem('mini_player_position', JSON.stringify(position));
    } catch {}
  }, [position]);

  useEffect(() => {
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', stopDrag);
    return () => {
      window.removeEventListener('pointermove', moveDrag);
      window.removeEventListener('pointerup', stopDrag);
    };
  }, [moveDrag, stopDrag]);

  const register = useCallback((details) => setPlayer(details), []);
  const close = useCallback(() => setPlayer(null), []);

  const isWatchPage = pathname?.startsWith('/watch/');

  return (
    <MiniPlayerContext.Provider value={useMemo(() => ({ register, close }), [register, close])}>
      {children}
      {player && !isWatchPage && (
        <aside
          className="mini-player fixed z-[60] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-emerald-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.25)] animate-fade-in"
          style={{ right: position.right, bottom: position.bottom }}
        >
          <div
            onPointerDown={startDrag}
            className="flex cursor-move touch-none items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2.5"
            title="Drag mini-player"
          >
            <Link
              href={`/watch/${player.matchId}?tab=live`}
              className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-900 hover:text-emerald-700"
            >
              <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-600 animate-pulse" />
              <span className="truncate">{player.matchTitle || 'Live match'}</span>
            </Link>
            <div className="flex items-center gap-1">
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <Grip className="h-3 w-3" />
              </span>
              <Link
                href={`/watch/${player.matchId}?tab=live`}
                aria-label="Open full match"
                className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={close}
                aria-label="Close mini player"
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="aspect-video w-full bg-black">
            <StreamPlayer
              streamUrl={player.streamUrl}
              channels={player.channels}
              matchTitle={player.matchTitle}
              matchStatus={player.matchStatus}
              videoOnly={true}
            />
          </div>
        </aside>
      )}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const context = useContext(MiniPlayerContext);
  if (!context) throw new Error('useMiniPlayer must be used inside MiniPlayerProvider');
  return context;
}
