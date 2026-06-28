'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { admin } = useAuth();

  return (
    <header className="h-16 glass-panel flex items-center px-6 gap-5 shrink-0 sticky top-0 z-30">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      {title && (
        <h1 className="text-lg font-bold text-zinc-800 hidden sm:block tracking-tight">
          {title}
        </h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center gap-2.5 px-4 py-2.5 bg-zinc-100/80 rounded-xl text-sm text-zinc-400 border border-transparent focus-within:border-indigo-200 focus-within:bg-white transition-all">
        <Search className="w-4 h-4 shrink-0 text-zinc-400" />
        <input
          type="text"
          placeholder="Quick search…"
          className="bg-transparent border-none outline-none text-zinc-700 w-full placeholder:text-zinc-400"
        />
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2.5">
        {/* Notifications bell */}
        <button
          className="relative p-2.5 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold ml-2 shadow-sm shadow-indigo-500/20 cursor-pointer ring-2 ring-transparent hover:ring-indigo-100 transition-all">
          {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
