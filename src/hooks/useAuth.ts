'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Admin, UserRole } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  admin: Admin | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    admin: null,
    role: null,
    loading: true,
  });

  const fetchAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .single();
    return data as Admin | null;
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = await fetchAdmin(user.id);
        setState({ user, admin, role: admin?.role ?? null, loading: false });
      } else {
        setState({ user: null, admin: null, role: null, loading: false });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const admin = await fetchAdmin(session.user.id);
          setState({
            user: session.user,
            admin,
            role: admin?.role ?? null,
            loading: false,
          });
        } else {
          setState({ user: null, admin: null, role: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAdmin, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const canWrite = state.role === 'super_admin' || state.role === 'admin';
  const isSuperAdmin = state.role === 'super_admin';
  const isAdmin = state.role === 'admin';

  return { ...state, signOut, canWrite, isSuperAdmin, isAdmin };
}
