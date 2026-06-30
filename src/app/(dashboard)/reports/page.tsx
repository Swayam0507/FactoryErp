'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmployees } from '@/hooks/useEmployees';
import { formatDate, formatCurrency, MONTHS, getYearOptions, getCurrentMonthYear, getMonthRange } from '@/lib/utils';
import { exportAttendanceToExcel, exportAdvancesToExcel, exportSalaryToExcel, exportEmployeesToExcel } from '@/lib/excel/exporters';
import { Download, FileSpreadsheet, Users, CalendarCheck, Wallet, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Employee, Attendance, AdvancePayment, SalaryReport } from '@/types';

export default function ReportsPage() {
  const supabase = createClient();
  const { employees } = useEmployees(true);
  const { month: curMonth, year: curYear } = getCurrentMonthYear();

  const [reportType, setReportType] = useState<'attendance' | 'advance' | 'salary' | 'employee'>('salary');
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [empFilter, setEmpFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(getMonthRange(curMonth, curYear).from);
  const [dateTo, setDateTo] = useState(getMonthRange(curMonth, curYear).to);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown[]>([]);
  const [loaded, setLoaded] = useState(false);

  const years = getYearOptions();

  const fetchData = async () => {
    setLoading(true);
    setData([]);

    if (reportType === 'employee') {
      const { data: emps } = await supabase.from('employees').select('*').order('full_name');
      setData(emps || []);
    } else if (reportType === 'attendance') {
      let q = supabase.from('attendance').select('*, employee:employees(*)').gte('attendance_date', dateFrom).lte('attendance_date', dateTo).order('attendance_date', { ascending: false });
      if (empFilter) q = q.eq('employee_id', empFilter);
      const { data: att } = await q;
      setData(att || []);
    } else if (reportType === 'advance') {
      let q = supabase.from('advance_payments').select('*, employee:employees(*)').gte('payment_date', dateFrom).lte('payment_date', dateTo).order('payment_date', { ascending: false });
      if (empFilter) q = q.eq('employee_id', empFilter);
      const { data: adv } = await q;
      setData(adv || []);
    } else if (reportType === 'salary') {
      let q = supabase.from('salary_reports').select('*, employee:employees(*)').eq('month', month).eq('year', year).order('employee(full_name)', { ascending: true });
      if (empFilter) q = q.eq('employee_id', empFilter);
      const { data: sal } = await q;
      setData(sal || []);
    }

    setLoaded(true);
    setLoading(false);
  };

  const handleExport = () => {
    if (!loaded || data.length === 0) { toast.error('Load the report first'); return; }
    if (reportType === 'employee') exportEmployeesToExcel(data as Employee[]);
    else if (reportType === 'attendance') exportAttendanceToExcel(data as (Attendance & { employee: Employee })[], `Attendance_${dateFrom}_${dateTo}`);
    else if (reportType === 'advance') exportAdvancesToExcel(data as (AdvancePayment & { employee: Employee })[], `Advances_${dateFrom}_${dateTo}`);
    else if (reportType === 'salary') exportSalaryToExcel(data as (SalaryReport & { employee: Employee })[], month, year);
    toast.success('Export started!');
  };

  const reportTypes = [
    { id: 'salary' as const, label: 'Salary Report', icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
    { id: 'attendance' as const, label: 'Attendance Report', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'advance' as const, label: 'Advance Report', icon: Wallet, color: 'text-amber-600 bg-amber-50' },
    { id: 'employee' as const, label: 'Employee List', icon: Users, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Generate and export detailed reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => { setReportType(rt.id); setLoaded(false); setData([]); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              reportType === rt.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${reportType === rt.id ? rt.color : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <rt.icon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium text-center ${reportType === rt.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
              {rt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Report Filters</h2>
        <div className="flex flex-wrap items-end gap-4">
          {/* Month/Year for salary */}
          {reportType === 'salary' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Date range for attendance/advance */}
          {(reportType === 'attendance' || reportType === 'advance') && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}

          {/* Employee filter */}
          {reportType !== 'employee' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Employee</label>
              <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Employees</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Generate
            </button>
            <button onClick={handleExport} disabled={!loaded || data.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-50 transition disabled:opacity-40">
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {loaded && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {data.length} records
            </p>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-400">Preview (showing up to 50 rows)</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {data.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No data for selected filters</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    {reportType === 'employee' && ['Code', 'Name', 'Mobile', 'Joining Date', 'Rate', 'Status'].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">{h}</th>)}
                    {reportType === 'attendance' && ['Employee', 'Date', 'Count', 'Notes'].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">{h}</th>)}
                    {reportType === 'advance' && ['Employee', 'Date', 'Cash (₹)', 'RTGS (₹)', 'Reason'].map((h) => <th key={h} className={`px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 ${h.includes('₹') ? 'text-right' : 'text-left'}`}>{h}</th>)}
                    {reportType === 'salary' && ['Employee', 'Attendance', 'Rate', 'Gross', 'Cash Adv.', 'RTGS Adv.', 'Final'].map((h) => <th key={h} className={`px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 ${h !== 'Employee' ? 'text-right' : 'text-left'}`}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(data as Record<string, unknown>[]).slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                      {reportType === 'employee' && (
                        <>
                          <td className="px-4 py-2.5 font-mono text-xs text-blue-700 dark:text-blue-300">{row.employee_code as string}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{row.full_name as string}</td>
                          <td className="px-4 py-2.5 text-slate-500">{(row.mobile_number as string) || '—'}</td>
                          <td className="px-4 py-2.5 text-slate-500">{row.joining_date ? formatDate(row.joining_date as string) : '—'}</td>
                          <td className="px-4 py-2.5 text-slate-600">{formatCurrency(row.rate_per_attendance as number)}</td>
                          <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.status as string}</span></td>
                        </>
                      )}
                      {reportType === 'attendance' && (
                        <>
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{((row.employee as Record<string,unknown>)?.full_name as string)}</td>
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(row.attendance_date as string)}</td>
                          <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">{row.attendance_count as number}</span></td>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{(row.notes as string) || '—'}</td>
                        </>
                      )}
                      {reportType === 'advance' && (
                        <>
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{((row.employee as Record<string,unknown>)?.full_name as string)}</td>
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(row.payment_date as string)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600 whitespace-nowrap">{(row.payment_mode === 'CASH' || !row.payment_mode) ? formatCurrency(row.amount as number) : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-purple-600 whitespace-nowrap">{row.payment_mode === 'RTGS' ? formatCurrency(row.amount as number) : '—'}</td>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{(row.reason as string) || '—'}</td>
                        </>
                      )}
                      {reportType === 'salary' && (
                        <>
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{((row.employee as Record<string,unknown>)?.full_name as string)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600 whitespace-nowrap">{row.total_attendance as number}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 whitespace-nowrap">{formatCurrency(row.rate as number)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">{formatCurrency(row.gross_salary as number)}</td>
                          <td className="px-4 py-2.5 text-right text-rose-500 whitespace-nowrap">-{formatCurrency(row.advance_cash as number || 0)}</td>
                          <td className="px-4 py-2.5 text-right text-rose-500 whitespace-nowrap">-{formatCurrency(row.advance_rtgs as number || 0)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(row.final_salary as number)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
