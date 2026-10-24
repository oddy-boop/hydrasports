'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search, User } from 'lucide-react';
import { useHydraSports } from './HydraContext';
import { useAuth } from './AuthContext';

export default function FootyTopbar() {
  const router = useRouter();
  const { setSidebarOpen, activeSport = 'Football', setActiveSport } = useHydraSports();
  const { user } = useAuth();

  const sports = ['Football', 'Tennis', 'Basketball', 'Rugby', 'Badminton'];

  return (
    <header className="sticky top-0 z-[60] h-[68px] w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-white/[0.06] bg-[#141221] backdrop-blur-xl">
      {/* Left: Brand Logo & Mobile Trigger */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-[200px]">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] group-hover:scale-105 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="4" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </div>
          <span className="text-[17px] font-black tracking-tight text-white flex items-center">
            Full<span className="text-[#a78bfa]">time</span>
          </span>
        </Link>
      </div>

      {/* Center: Sports Category Tabs from Image 1 */}
      <nav className="hidden md:flex items-center gap-1 sm:gap-2">
        {sports.map((sport) => {
          const isActive = (activeSport || 'Football').toLowerCase() === sport.toLowerCase();
          return (
            <button
              key={sport}
              type="button"
              onClick={() => setActiveSport && setActiveSport(sport)}
              className={`relative px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{sport}</span>
              {isActive && (
                <span className="absolute bottom-[-18px] left-0 right-0 h-[3px] bg-[#8b5cf6] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Notifications & User Avatar Profile */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-[200px] justify-end">
        {/* Notification Bell with Badge */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-[#141221]" />
        </button>

        {/* User Profile Avatar linking to Auth / Account */}
        <Link
          href="/auth"
          className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-white/[0.08] border border-white/[0.08] transition-all group"
          title={user?.name ? `Logged in as ${user.name}` : 'Sign in / Register'}
        >
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-300 group-hover:text-white pr-1">
            {user?.name || 'Miguel Fox'}
          </span>
          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20 bg-slate-800 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
