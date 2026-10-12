'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme('light');
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  };

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-lg bg-zinc-900/40 border border-zinc-800 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/70 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm group cursor-pointer"
      title="Light mode is active"
    >
      <span className="sr-only">Toggle Theme</span>
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-500 transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 text-violet-600 transition-transform duration-500 group-hover:-rotate-45 group-hover:scale-110" />
      )}
    </button>
  );
}
