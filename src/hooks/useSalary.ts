'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SalaryReport, Employee } from '@/types';
import { getMonthlyAttendance } from './useAttendance';
import { getMonthlyAdvances } from './useAdvances';

type SalaryReportWithEmployee = SalaryReport & { employee: Employee };

export function useSalary() {
  const supabase = createClient();
  const [reports, setReports] = useState<SalaryReportWithEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (month: number, year: number) => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('salary_reports')
        .select('*, employee:employees(*)')
        .eq('month', month)
        .eq('year', year)
        .order('employee(full_name)', { ascending: true });

      if (err) setError(err.message);
      else setReports((data as SalaryReportWithEmployee[]) || []);
      setLoading(false);
    },
    [supabase]
  );

  const generateMonthlyReport = async (
    month: number,
    year: number,
    generatedBy: string
  ): Promise<SalaryReportWithEmployee[]> => {
    setLoading(true);
    setError(null);

    // Fetch all active employees
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');

    if (empErr) {
      setError(empErr.message);
      setLoading(false);
      throw new Error(empErr.message);
    }

    const results: SalaryReportWithEmployee[] = [];

    for (const emp of employees as Employee[]) {
      const totalAttendance = await getMonthlyAttendance(emp.id, month, year);
      const advances = await getMonthlyAdvances(emp.id, month, year);
      const grossSalary = totalAttendance * emp.rate_per_attendance;
      const finalSalary = Math.max(0, grossSalary - advances.total);

      const payload = {
        employee_id: emp.id,
        month,
        year,
        total_attendance: totalAttendance,
        rate: emp.rate_per_attendance,
        gross_salary: grossSalary,
        advance_amount: advances.total,
        advance_cash: advances.cash,
        advance_rtgs: advances.rtgs,
        final_salary: finalSalary,
        generated_by: generatedBy,
        generated_at: new Date().toISOString(),
      };

      const { data: saved, error: saveErr } = await supabase
        .from('salary_reports')
        .upsert(payload, { onConflict: 'employee_id,month,year' })
        .select('*, employee:employees(*)')
        .single();

      if (!saveErr && saved) {
        results.push(saved as SalaryReportWithEmployee);
      }
    }

    setReports(results);
    setLoading(false);
    return results;
  };

  const deleteReport = async (id: string) => {
    const { error: err } = await supabase
      .from('salary_reports')
      .delete()
      .eq('id', id);
    if (err) throw new Error(err.message);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    generateMonthlyReport,
    deleteReport,
  };
}
