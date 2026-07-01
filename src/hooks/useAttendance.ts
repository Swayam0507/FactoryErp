'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Attendance, Employee } from '@/types';

type AttendanceWithEmployee = Attendance & { employee: Employee; marked_by?: { name: string; role: string } | null };

interface AttendanceFilters {
  employeeId?: string;
  from?: string;
  to?: string;
  month?: number;
  year?: number;
}

export function useAttendance(filters: AttendanceFilters = {}) {
  const supabase = createClient();
  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('attendance')
      .select('*, employee:employees(*)')
      .order('attendance_date', { ascending: false });

    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.from) query = query.gte('attendance_date', filters.from);
    if (filters.to) query = query.lte('attendance_date', filters.to);

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    } else {
      const attendanceData = (data as AttendanceWithEmployee[]) || [];
      
      // Manually fetch 'marked_by' admin details to avoid foreign key join issues
      const adminIds = Array.from(new Set(attendanceData.map(r => r.created_by).filter(Boolean))) as string[];
      if (adminIds.length > 0) {
        const { data: admins } = await supabase.from('admins').select('id, name, role').in('id', adminIds);
        if (admins) {
          const adminMap = new Map(admins.map(a => [a.id, a]));
          attendanceData.forEach(r => {
            if (r.created_by && adminMap.has(r.created_by)) {
              r.marked_by = adminMap.get(r.created_by);
            }
          });
        }
      }
      
      setRecords(attendanceData);
    }
    setLoading(false);
  }, [supabase, filters.employeeId, filters.from, filters.to]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const upsertAttendance = async (payload: {
    employee_id: string;
    attendance_date: string;
    attendance_count: number;
    notes?: string;
    created_by: string;
  }) => {
    const { data, error: err } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'employee_id,attendance_date' })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await fetchRecords();
    return data;
  };

  const deleteAttendance = async (id: string) => {
    // Check role and fetch record details before delete
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: admin } = await supabase.from('admins').select('role, name').eq('id', user.id).single();
        if (admin && admin.role === 'admin') {
          const { data: record } = await supabase.from('attendance').select('*, employee:employees(full_name)').eq('id', id).single();
          if (record && record.employee) {
            await supabase.from('notifications').insert({
              type: 'info',
              title: 'Attendance Record Deleted',
              message: `Manager ${admin.name} deleted the attendance record of ${record.employee.full_name} for date ${record.attendance_date}.`,
              target_role: 'super_admin'
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to log delete attendance notification', e);
    }

    const { error: err } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchRecords();
  };

  return { records, loading, error, refetch: fetchRecords, upsertAttendance, deleteAttendance };
}

// Get monthly attendance totals for salary calculation
export async function getMonthlyAttendance(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  const supabase = createClient();
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data } = await supabase
    .from('attendance')
    .select('attendance_count')
    .eq('employee_id', employeeId)
    .gte('attendance_date', from)
    .lte('attendance_date', to);

  return (data || []).reduce((sum, r) => sum + (r.attendance_count || 0), 0);
}
