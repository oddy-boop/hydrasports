'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  return (
    <button
      className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#1e1c32] text-purple-400 hover:text-white hover:bg-white/10 transition-all shadow-sm group cursor-pointer"
      title="Dark mode is active"
    >
      <Moon className="h-4 w-4 text-purple-400 transition-transform duration-500 group-hover:-rotate-45" />
    </button>
  );
}
