'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Attendance, Employee } from '@/types';

type AttendanceWithEmployee = Attendance & { employee: Employee };

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
    if (err) setError(err.message);
    else setRecords((data as AttendanceWithEmployee[]) || []);
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
