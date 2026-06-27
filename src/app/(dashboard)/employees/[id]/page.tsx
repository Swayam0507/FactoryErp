'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, getCurrentMonthYear, getMonthRange } from '@/lib/utils';
import {
  ArrowLeft, Pencil, Phone, MapPin, Calendar, IndianRupee,
  CalendarCheck, Wallet, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { Employee, Attendance, AdvancePayment, SalaryReport } from '@/types';

type Tab = 'details' | 'attendance' | 'advances' | 'salary';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const { canWrite } = useAuth();
  const { month, year } = getCurrentMonthYear();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryReport[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('employees').select('*').eq('id', id).single();
      setEmployee(data as Employee);

      const [{ data: att }, { data: adv }, { data: sal }] = await Promise.all([
        supabase.from('attendance').select('*').eq('employee_id', id).order('attendance_date', { ascending: false }).limit(50),
        supabase.from('advance_payments').select('*').eq('employee_id', id).order('payment_date', { ascending: false }),
        supabase.from('salary_reports').select('*').eq('employee_id', id).order('year', { ascending: false }).order('month', { ascending: false }),
      ]);

      setAttendance((att || []) as Attendance[]);
      setAdvances((adv || []) as AdvancePayment[]);
      setSalaryHistory((sal || []) as SalaryReport[]);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const tabs = [
    { id: 'details' as Tab, label: 'Details', icon: IndianRupee },
    { id: 'attendance' as Tab, label: 'Attendance', icon: CalendarCheck },
    { id: 'advances' as Tab, label: 'Advances', icon: Wallet },
    { id: 'salary' as Tab, label: 'Salary History', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-32 rounded-xl skeleton-shimmer" />
        <div className="h-64 rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center py-20 text-slate-400">Employee not found</div>;
  }

  const totalAdvances = advances.reduce((s, a) => s + a.amount, 0);
  const totalAttendance = attendance.reduce((s, a) => s + a.attendance_count, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/employees" className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{employee.full_name}</h1>
          <p className="text-slate-500 text-sm font-mono">{employee.employee_code}</p>
        </div>
        {canWrite && (
          <Link href={`/employees/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {employee.full_name.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400" />
              {employee.mobile_number || '—'}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              Joined: {formatDate(employee.joining_date)}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              Rate: {formatCurrency(employee.rate_per_attendance)} / attendance
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {employee.status}
              </span>
            </div>
            {employee.address && (
              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                {employee.address}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalAttendance}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total Attendance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalAdvances)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total Advances</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(Math.max(0, totalAttendance * employee.rate_per_attendance - totalAdvances))}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Est. Net Pay</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'attendance' && (
            <div className="overflow-x-auto">
              {attendance.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">No attendance records</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 font-semibold text-slate-500">Date</th>
                      <th className="pb-3 font-semibold text-slate-500">Count</th>
                      <th className="pb-3 font-semibold text-slate-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                        <td className="py-2.5 text-slate-700 dark:text-slate-300">{formatDate(a.attendance_date)}</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-medium">
                            {a.attendance_count} units
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 text-xs">{a.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'advances' && (
            <div className="overflow-x-auto">
              {advances.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">No advance records</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 font-semibold text-slate-500">Date</th>
                      <th className="pb-3 font-semibold text-slate-500">Mode</th>
                      <th className="pb-3 font-semibold text-slate-500">Amount</th>
                      <th className="pb-3 font-semibold text-slate-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                        <td className="py-2.5 text-slate-700 dark:text-slate-300">{formatDate(a.payment_date)}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${a.payment_mode === 'RTGS' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {a.payment_mode || 'CASH'}
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(a.amount)}</td>
                        <td className="py-2.5 text-slate-400 text-xs">{a.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'salary' && (
            <div className="overflow-x-auto">
              {salaryHistory.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">No salary reports generated yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 font-semibold text-slate-500">Month/Year</th>
                      <th className="pb-3 font-semibold text-slate-500 text-right">Attendance</th>
                      <th className="pb-3 font-semibold text-slate-500 text-right">Gross</th>
                      <th className="pb-3 font-semibold text-slate-500 text-right">Cash Adv</th>
                      <th className="pb-3 font-semibold text-slate-500 text-right">RTGS Adv</th>
                      <th className="pb-3 font-semibold text-slate-500 text-right">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistory.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                        <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                          {new Date(s.year, s.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">{s.total_attendance}</td>
                        <td className="py-2.5 text-right text-slate-600">{formatCurrency(s.gross_salary)}</td>
                        <td className="py-2.5 text-right text-rose-500">{formatCurrency(s.advance_cash || 0)}</td>
                        <td className="py-2.5 text-right text-rose-500">{formatCurrency(s.advance_rtgs || 0)}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">{formatCurrency(s.final_salary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Employee Code', value: employee.employee_code },
                { label: 'Full Name', value: employee.full_name },
                { label: 'Mobile Number', value: employee.mobile_number || '—' },
                { label: 'Joining Date', value: formatDate(employee.joining_date) },
                { label: 'Rate per Attendance', value: formatCurrency(employee.rate_per_attendance) },
                { label: 'Status', value: employee.status },
                { label: 'Address', value: employee.address || '—' },
                { label: 'Created At', value: formatDate(employee.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
