'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AppNotification } from '@/types';
import { todayStr, getCurrentMonthYear } from '@/lib/utils';

export function useNotifications() {
  const supabase = createClient();
  const { admin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!admin) return;
    setLoading(true);
    
    // Admins can see 'all' plus their specific role
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error && data) {
      setNotifications(data as AppNotification[]);
    }
    setLoading(false);
  }, [admin, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (notifications.filter(n => !n.is_read).length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const clearAll = async () => {
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all accessible
    setNotifications([]);
  };

  // Automated checks on load
  useEffect(() => {
    if (!admin || admin.role !== 'super_admin') return;

    const runAutomatedChecks = async () => {
      // 1. Missing Attendance Check (Run after 5 PM)
      const now = new Date();
      if (now.getHours() >= 17) {
        const today = todayStr();
        // Check if we already alerted today
        const { data: existingAttAlert } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'warning')
          .like('title', '%Attendance Reminder%')
          .gte('created_at', today + 'T00:00:00Z')
          .limit(1);

        if (!existingAttAlert || existingAttAlert.length === 0) {
          const { count: activeCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active');
          const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', today);
          
          if (activeCount && attendanceCount !== null && attendanceCount < (activeCount * 0.5)) {
            // Less than half marked
            await supabase.from('notifications').insert({
              type: 'warning',
              title: 'Attendance Reminder',
              message: `It is past 5 PM and only ${attendanceCount} out of ${activeCount} active workers have their attendance marked for today.`,
              target_role: 'all'
            });
            fetchNotifications();
          }
        }
      }

      // 2. Monthly Salary Generation Check (Run 1st-5th of month)
      const date = now.getDate();
      if (date >= 1 && date <= 5) {
        const { month, year } = getCurrentMonthYear();
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth === 0) { prevMonth = 12; prevYear--; }

        // Check if generated
        const { count: salaryCount } = await supabase
          .from('salary_reports')
          .select('*', { count: 'exact', head: true })
          .eq('month', prevMonth)
          .eq('year', prevYear);

        if (salaryCount === 0) {
          // Check if we already alerted
          const { data: existingSalAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('type', 'info')
            .like('title', '%Salary Generation%')
            .gte('created_at', todayStr() + 'T00:00:00Z')
            .limit(1);

          if (!existingSalAlert || existingSalAlert.length === 0) {
            await supabase.from('notifications').insert({
              type: 'info',
              title: 'Salary Generation Reminder',
              message: `It is the start of a new month. Do not forget to generate and lock salary reports for ${prevMonth}/${prevYear}.`,
              target_role: 'super_admin'
            });
            fetchNotifications();
          }
        }
      }
    };

    runAutomatedChecks();
  }, [admin, supabase, fetchNotifications]);

  // Insert a notification helper (can be used anywhere)
  const notify = async (payload: { type: 'alert' | 'warning' | 'info'; title: string; message: string; target_role?: 'super_admin' | 'admin' | 'all' }) => {
    await supabase.from('notifications').insert(payload);
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notify,
    refetch: fetchNotifications
  };
}
