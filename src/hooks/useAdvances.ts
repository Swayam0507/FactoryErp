'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AdvancePayment, Employee } from '@/types';

type AdvanceWithEmployee = AdvancePayment & { employee: Employee };

interface AdvanceFilters {
  employeeId?: string;
  from?: string;
  to?: string;
}

export function useAdvances(filters: AdvanceFilters = {}) {
  const supabase = createClient();
  const [advances, setAdvances] = useState<AdvanceWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('advance_payments')
      .select('*, employee:employees(*)')
      .order('payment_date', { ascending: false });

    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.from) query = query.gte('payment_date', filters.from);
    if (filters.to) query = query.lte('payment_date', filters.to);

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setAdvances((data as AdvanceWithEmployee[]) || []);
    setLoading(false);
  }, [supabase, filters.employeeId, filters.from, filters.to]);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  const addAdvance = async (payload: {
    employee_id: string;
    amount: number;
    payment_mode: 'CASH' | 'RTGS';
    reason: string;
    payment_date: string;
    created_by: string;
  }) => {
    const { data, error: err } = await supabase
      .from('advance_payments')
      .insert(payload)
      .select()
      .single();
    if (err) throw new Error(err.message);
    await fetchAdvances();
    return data;
  };

  const updateAdvance = async (id: string, payload: Partial<AdvancePayment>) => {
    const { error: err } = await supabase
      .from('advance_payments')
      .update(payload)
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchAdvances();
  };

  const deleteAdvance = async (id: string) => {
    const { error: err } = await supabase
      .from('advance_payments')
      .delete()
      .eq('id', id);
    if (err) throw new Error(err.message);
    await fetchAdvances();
  };

  return {
    advances,
    loading,
    error,
    refetch: fetchAdvances,
    addAdvance,
    updateAdvance,
    deleteAdvance,
  };
}

export async function getMonthlyAdvances(
  employeeId: string,
  month: number,
  year: number
): Promise<{ total: number; cash: number; rtgs: number }> {
  const supabase = createClient();
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data } = await supabase
    .from('advance_payments')
    .select('amount, payment_mode')
    .eq('employee_id', employeeId)
    .gte('payment_date', from)
    .lte('payment_date', to);

  const advances = data || [];
  let cash = 0;
  let rtgs = 0;
  let total = 0;

  advances.forEach(a => {
    const amt = a.amount || 0;
    total += amt;
    if (a.payment_mode === 'RTGS') rtgs += amt;
    else cash += amt;
  });

  return { total, cash, rtgs };
}
