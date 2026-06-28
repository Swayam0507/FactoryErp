'use client';

import { useState, useEffect } from 'react';
import { useSalary } from '@/hooks/useSalary';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { formatCurrency, formatMonthYear, MONTHS, getYearOptions, getCurrentMonthYear } from '@/lib/utils';
import { exportSalaryToExcel } from '@/lib/excel/exporters';
import { createClient } from '@/lib/supabase/client';
import {
  Calculator, Download, FileText, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, TrendingUp, IndianRupee, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { FactorySettings, SalaryReport, Employee } from '@/types';

export default function SalaryPage() {
  const supabase = createClient();
  const { reports, loading, fetchReports, generateMonthlyReport } = useSalary();
  const { user, canWrite } = useAuth();
  const { sendNotification } = useWhatsApp();

  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [generating, setGenerating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const years = getYearOptions();

  useEffect(() => {
    const load = async () => {
      await fetchReports(month, year);
      setHasLoaded(true);
    };
    load();
  }, [month, year, fetchReports]);

  const handleGenerate = async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    if (!confirm(`Generate salary report for ${formatMonthYear(month, year)}? This will overwrite existing records.`)) return;

    setGenerating(true);
    try {
      await generateMonthlyReport(month, year, user.id);
      setHasLoaded(true);
      toast.success(`Salary report generated for ${formatMonthYear(month, year)}!`);

      // Auto-send WhatsApp to all employees with mobile numbers
      const latestReports = reports;
      if (latestReports.length > 0) {
        const monthLabel = formatMonthYear(month, year);
        let sentCount = 0;
        for (const r of latestReports) {
          const emp = (r as SalaryReport & { employee: Employee }).employee;
          if (emp?.mobile_number) {
            try {
              await sendNotification({
                type: 'salary',
                employeeName: emp.full_name,
                mobileNumber: emp.mobile_number,
                data: {
                  month: MONTHS.find(m => m.value === month)?.label ?? monthLabel,
                  year: String(year),
                  attendanceCount: r.total_attendance,
                  grossSalary: r.gross_salary.toFixed(2),
                  advances: r.advance_amount.toFixed(2),
                  netSalary: r.final_salary.toFixed(2),
                },
              }, false).then(success => { if (success) sentCount++; });
            } catch {}
          }
        }
        if (sentCount > 0) toast.success(`WhatsApp sent to ${sentCount} employees`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
    setGenerating(false);
  };

  const handleSendWhatsApp = async (r: SalaryReport & { employee: Employee }) => {
    const emp = r.employee;
    if (!emp?.mobile_number) { toast.error('No mobile number'); return; }
    try {
      await sendNotification({
        type: 'salary',
        employeeName: emp.full_name,
        mobileNumber: emp.mobile_number,
        data: {
          month: MONTHS.find(m => m.value === month)?.label ?? formatMonthYear(month, year),
          year: String(year),
          attendanceCount: r.total_attendance,
          grossSalary: r.gross_salary.toFixed(2),
          advances: r.advance_amount.toFixed(2),
          netSalary: r.final_salary.toFixed(2),
        },
      });
    } catch { toast.error('WhatsApp send failed'); }
  };

  const handleDownloadPDF = async (report: SalaryReport & { employee: Employee }) => {
    const { data: settings } = await supabase.from('factory_settings').select('*').single();
    const { downloadSalarySlip } = await import('@/lib/pdf/salarySlip');
    downloadSalarySlip({
      report,
      employee: report.employee,
      settings: (settings || { factory_name: 'VivekBhai Industries' }) as FactorySettings,
    });
  };

  const handleBulkPDF = async () => {
    if (reports.length === 0) { toast.error('No reports to download'); return; }
    const { data: settings } = await supabase.from('factory_settings').select('*').single();
    const { generateBulkSalarySlips } = await import('@/lib/pdf/salarySlip');
    generateBulkSalarySlips(
      reports as (SalaryReport & { employee: Employee })[],
      (settings || { factory_name: 'VivekBhai Industries' }) as FactorySettings
    );
    toast.success('Downloading salary slips…');
  };

  const totalGross = reports.reduce((s, r) => s + r.gross_salary, 0);
  const totalAdvance = reports.reduce((s, r) => s + r.advance_amount, 0);
  const totalFinal = reports.reduce((s, r) => s + r.final_salary, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Salary</h1>
          <p className="text-slate-500 text-sm mt-0.5">Calculate and manage monthly salaries</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {canWrite && (
            <button
              onClick={handleGenerate}
              disabled={generating || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Generate Report
            </button>
          )}
          {hasLoaded && reports.length > 0 && (
            <>
              <button
                onClick={() => exportSalaryToExcel(reports as (SalaryReport & { employee: Employee })[], month, year)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={handleBulkPDF}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                <FileText className="w-4 h-4" />
                All PDFs
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {hasLoaded && reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-400">Gross Salary</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(totalGross)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-400">Total Cash Adv.</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(reports.reduce((s, r) => s + (r.advance_cash || 0), 0))}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-400">Total RTGS Adv.</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(reports.reduce((s, r) => s + (r.advance_rtgs || 0), 0))}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm text-slate-400">Net Payable</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalFinal)}</p>
          </div>
        </div>
      )}

      {/* Salary Table */}
      {hasLoaded && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {reports.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No salary report for {formatMonthYear(month, year)}</p>
              {canWrite && <p className="text-sm mt-1">Click "Generate Report" to calculate salaries</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Attendance</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Rate</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Gross</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Cash Adv</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">RTGS Adv</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Final Salary</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{(r as SalaryReport & { employee: Employee }).employee?.full_name}</p>
                        <p className="text-xs font-mono text-slate-400">{(r as SalaryReport & { employee: Employee }).employee?.employee_code}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">{r.total_attendance}</td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{formatCurrency(r.rate)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(r.gross_salary)}</td>
                      <td className="px-4 py-3 text-right text-rose-500 hidden lg:table-cell">-{formatCurrency(r.advance_cash || 0)}</td>
                      <td className="px-4 py-3 text-right text-rose-500 hidden lg:table-cell">-{formatCurrency(r.advance_rtgs || 0)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.final_salary)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDownloadPDF(r as SalaryReport & { employee: Employee })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition"
                          >
                            <FileText className="w-3 h-3" />
                            PDF
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(r as SalaryReport & { employee: Employee })}
                            title="Send WhatsApp"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg transition"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-sm">TOTAL ({reports.length} employees)</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalGross)}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 hidden lg:table-cell">-{formatCurrency(reports.reduce((s, r) => s + (r.advance_cash || 0), 0))}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 hidden lg:table-cell">-{formatCurrency(reports.reduce((s, r) => s + (r.advance_rtgs || 0), 0))}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(totalFinal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {!hasLoaded && !loading && (
        <div className="text-center py-20">
          <IndianRupee className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
          <p className="text-slate-400">Select a month and year, then click "Load Report"</p>
        </div>
      )}
    </div>
  );
}
