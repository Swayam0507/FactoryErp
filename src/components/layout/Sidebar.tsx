'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Building2,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    label: 'Employees',
    href: '/employees',
    icon: Users,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: CalendarCheck,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    label: 'Advances',
    href: '/advances',
    icon: Wallet,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    label: 'Salary',
    href: '/salary',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'viewer'],
  },
  {
    label: 'Admin Users',
    href: '/admins',
    icon: ShieldCheck,
    roles: ['super_admin'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['super_admin'],
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { admin, role, signOut } = useAuth();

  const filteredNav = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <aside className="flex flex-col h-full sidebar-bg text-zinc-300 w-64 shrink-0 shadow-2xl z-40 relative">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">VivekBhai</p>
            <p className="text-zinc-400 text-xs font-medium">Industries ERP</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-0.5">
        {filteredNav.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn('w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300')} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 hover:bg-white/5 transition cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{admin?.name || 'Admin'}</p>
            <p className="text-zinc-400 text-xs capitalize truncate font-medium">
              {role?.replace('_', ' ') || 'User'}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
