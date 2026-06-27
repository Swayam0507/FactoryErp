'use client';

import { useState } from 'react';
import { Menu, Bell, Moon, Sun, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { admin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode((v) => !v);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      {title && (
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
          {title}
        </h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-400">
        <Search className="w-4 h-4 shrink-0" />
        <span>Quick search…</span>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications bell */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold ml-1">
          {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
