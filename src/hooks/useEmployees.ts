'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Employee } from '@/types';

export function useEmployees(includeInactive = false) {
  const supabase = createClient();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    } else {
      setEmployees(data as Employee[]);
    }
    setLoading(false);
  }, [supabase, includeInactive]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = async (payload: Omit<Employee, 'id' | 'created_at'>) => {
    const { data, error: err } = await supabase
      .from('employees')
      .insert(payload)
      .select()
      .single();
    if (err) throw new Error(err.message);
    await fetchEmployees();
    return data as Employee;
  };

  const updateEmployee = async (id: string, payload: Partial<Employee>) => {
    const { error: err } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    const { error: err } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchEmployees();
  };

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
