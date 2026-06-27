'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatDate, todayStr, getMonthRange, getCurrentMonthYear } from '@/lib/utils';
import {
  Plus, Search, Filter, Download, Pencil, Trash2,
  ChevronLeft, ChevronRight, Loader2, CalendarCheck, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { exportAttendanceToExcel } from '@/lib/excel/exporters';
import AttendanceFormModal from './AttendanceFormModal';
import type { Attendance, Employee } from '@/types';

const PAGE_SIZE = 20;

export default function AttendancePage() {
  const { month, year } = getCurrentMonthYear();
  const { from, to } = getMonthRange(month, year);

  const [dateFrom, setDateFrom] = useState(from);
  const [dateTo, setDateTo] = useState(to);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<(Attendance & { employee: Employee }) | null>(null);

  const { records, loading, deleteAttendance, refetch } = useAttendance({
    from: dateFrom,
    to: dateTo,
    employeeId: employeeFilter || undefined,
  });

  const { employees } = useEmployees(false);
  const { canWrite } = useAuth();

  const filtered = useMemo(() => {
    if (!search) return records;
    return records.filter(
      (r) =>
        r.employee?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.employee?.employee_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete attendance record for ${name}?`)) return;
    try {
      await deleteAttendance(id);
      toast.success('Record deleted');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const supabase = createClient();
  const handleResendWhatsApp = async (rec: Attendance & { employee: Employee }) => {
    const emp = rec.employee;
    if (!emp?.mobile_number) { toast.error('No mobile number for this employee'); return; }
    try {
      const curMonth = getCurrentMonthYear();
      const { from, to } = getMonthRange(curMonth.month, curMonth.year);
      const { data: monthAtt } = await supabase.from('attendance').select('attendance_count').eq('employee_id', rec.employee_id).gte('attendance_date', from).lte('attendance_date', to);
      const { data: monthAdv } = await supabase.from('advance_payments').select('amount').eq('employee_id', rec.employee_id).gte('payment_date', from).lte('payment_date', to);
      const monthlyAttendance = (monthAtt || []).reduce((s, r) => s + r.attendance_count, 0);
      const totalAdvance = (monthAdv || []).reduce((s, r) => s + r.amount, 0);
      const currentSalary = monthlyAttendance * emp.rate_per_attendance;
      const payable = Math.max(0, currentSalary - totalAdvance);

      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'attendance',
          employeeName: emp.full_name,
          mobileNumber: emp.mobile_number,
          data: {
            todayAttendance: rec.attendance_count,
            monthlyAttendance,
            currentSalary: currentSalary.toFixed(2),
            advance: totalAdvance.toFixed(2),
            payable: payable.toFixed(2),
          },
        }),
      });
      if (res.ok) toast.success(`WhatsApp sent to ${emp.full_name}`);
      else toast.error('WhatsApp send failed');
    } catch { toast.error('WhatsApp send failed'); }
  };

  const totalAttendance = records.reduce((s, r) => s + r.attendance_count, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {records.length} records · {totalAttendance} total units
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAttendanceToExcel(records as (Attendance & { employee: Employee })[], `Attendance_${dateFrom}_${dateTo}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link
            href="/attendance/bulk"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <CalendarCheck className="w-4 h-4" />
            Bulk Entry
          </Link>
          {canWrite && (
            <button
              onClick={() => { setEditRecord(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={employeeFilter}
          onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="self-center text-slate-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Count</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Notes</th>
                {canWrite && <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded skeleton-shimmer" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No attendance records found</td></tr>
              ) : (
                paginated.map((rec, idx) => (
                  <tr key={rec.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                    <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/employees/${rec.employee_id}`} className="font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 transition">
                        {rec.employee?.full_name}
                      </Link>
                      <p className="text-xs text-slate-400 font-mono">{rec.employee?.employee_code}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(rec.attendance_date)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-sm ${i < rec.attendance_count ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                          />
                        ))}
                        <span className="ml-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{rec.attendance_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{rec.notes || '—'}</td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleResendWhatsApp(rec as Attendance & { employee: Employee })}
                            title="Send WhatsApp"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditRecord(rec as Attendance & { employee: Employee }); setShowForm(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id, rec.employee?.full_name || '')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showForm && (
        <AttendanceFormModal
          editRecord={editRecord}
          employees={employees}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          onSuccess={() => { setShowForm(false); setEditRecord(null); refetch(); }}
        />
      )}
    </div>
  );
}
