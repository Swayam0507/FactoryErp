'use client';

import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, requiredRole, fallback = null }: RoleGuardProps) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (!role) return null;

  const allowed = Array.isArray(requiredRole)
    ? requiredRole.includes(role)
    : role === requiredRole ||
      (requiredRole === 'admin' && role === 'super_admin') ||
      (requiredRole === 'viewer' && (role === 'super_admin' || role === 'admin'));

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Wrapper that only renders children if user has write access (admin or super_admin)
 */
export function WriteOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { canWrite, loading } = useAuth();
  if (loading) return null;
  return canWrite ? <>{children}</> : <>{fallback}</>;
}

/**
 * Wrapper for super admin only content
 */
export function SuperAdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  return isSuperAdmin ? <>{children}</> : <>{fallback}</>;
}
