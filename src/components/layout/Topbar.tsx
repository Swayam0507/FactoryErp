'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, Check, Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDate } from '@/lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-transparent';
    switch (type) {
      case 'alert': return 'bg-rose-50 dark:bg-rose-900/10';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/10';
      default: return 'bg-blue-50 dark:bg-blue-900/10';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Mark all as read">
                  <Check className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Clear all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No notifications right now</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${getBg(n.type, n.is_read)}`}
                    onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm ${n.is_read ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-900 dark:text-white font-semibold'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 pt-1">
                        {new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
        {/* Notifications bell dropdown */}
        <NotificationDropdown />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold ml-2 shadow-sm shadow-indigo-500/20 cursor-pointer ring-2 ring-transparent hover:ring-indigo-100 transition-all">
          {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
