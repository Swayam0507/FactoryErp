'use client';

import { useState, useMemo } from 'react';
import { useAdvances } from '@/hooks/useAdvances';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { formatDate, formatCurrency, getCurrentMonthYear, getMonthRange } from '@/lib/utils';
import {
  Plus, Search, Download, Pencil, Trash2,
  ChevronLeft, ChevronRight, Loader2, X, MessageSquare
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { advanceSchema, type AdvanceFormValues } from '@/lib/validations/advance';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { exportAdvancesToExcel } from '@/lib/excel/exporters';
import type { AdvancePayment, Employee } from '@/types';

const PAGE_SIZE = 20;

export default function AdvancesPage() {
  const { month, year } = getCurrentMonthYear();
  const { from, to } = getMonthRange(month, year);

  const [dateFrom, setDateFrom] = useState(from);
  const [dateTo, setDateTo] = useState(to);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<(AdvancePayment & { employee: Employee }) | null>(null);

  const { advances, loading, addAdvance, updateAdvance, deleteAdvance, refetch } = useAdvances({
    from: dateFrom,
    to: dateTo,
    employeeId: employeeFilter || undefined,
  });

  const { employees } = useEmployees(false);
  const { canWrite, user } = useAuth();
  const { sendNotification } = useWhatsApp();
  const supabase = createClient();

  // Manual WhatsApp resend for advances
  const handleResendWhatsApp = async (adv: AdvancePayment & { employee: Employee }) => {
    if (!adv.employee?.mobile_number) { toast.error('No mobile number for this employee'); return; }
    try {
      const { month, year } = getCurrentMonthYear();
      const { from, to } = getMonthRange(month, year);
      const { data: monthAtt } = await supabase.from('attendance').select('attendance_count').eq('employee_id', adv.employee_id).gte('attendance_date', from).lte('attendance_date', to);
      const { data: monthAdv } = await supabase.from('advance_payments').select('amount').eq('employee_id', adv.employee_id).gte('payment_date', from).lte('payment_date', to);
      const monthlyAtt = (monthAtt || []).reduce((s, r) => s + r.attendance_count, 0);
      const totalAdv = (monthAdv || []).reduce((s, r) => s + r.amount, 0);
      const gross = monthlyAtt * adv.employee.rate_per_attendance;
      const payable = Math.max(0, gross - totalAdv);

      await sendNotification({
        type: 'advance',
        employeeName: adv.employee.full_name,
        mobileNumber: adv.employee.mobile_number,
        data: { amount: adv.amount.toFixed(2), date: adv.payment_date, payable: payable.toFixed(2) },
      });
    } catch {
      toast.error('WhatsApp send failed');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return advances;
    return advances.filter(
      (a) =>
        a.employee?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.employee?.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        (a.reason || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [advances, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalAmount = advances.reduce((s, a) => s + a.amount, 0);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete advance for ${name}?`)) return;
    try {
      await deleteAdvance(id);
      toast.success('Advance deleted');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Advances</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {advances.length} records · Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAdvancesToExcel(filtered as (AdvancePayment & { employee: Employee })[], `Advances_${dateFrom}_${dateTo}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {canWrite && (
            <button
              onClick={() => { setEditRecord(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Advance
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
            placeholder="Search…"
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
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => {
          if (e.target.value > dateTo) toast.error('From date cannot be later than To date');
          else { setDateFrom(e.target.value); setPage(1); }
        }} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="self-center text-slate-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => {
          if (e.target.value < dateFrom) toast.error('To date cannot be earlier than From date');
          else { setDateTo(e.target.value); setPage(1); }
        }} className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Mode</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Reason</th>
                {canWrite && <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded skeleton-shimmer" /></td>)}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No advance records found</td></tr>
              ) : (
                paginated.map((adv, idx) => (
                  <tr key={adv.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                    <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{adv.employee?.full_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{adv.employee?.employee_code}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(adv.payment_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        adv.payment_mode === 'RTGS' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {adv.payment_mode || 'CASH'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">{formatCurrency(adv.amount)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{adv.reason || '—'}</td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleResendWhatsApp(adv as AdvancePayment & { employee: Employee })} title="Resend WhatsApp" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"><MessageSquare className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditRecord(adv as AdvancePayment & { employee: Employee }); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(adv.id, adv.employee?.full_name || '')} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Advance Form Modal */}
      {showForm && (
        <AdvanceModal
          editRecord={editRecord}
          employees={employees}
          userId={user?.id || ''}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          onSuccess={() => { setShowForm(false); setEditRecord(null); refetch(); }}
          addAdvance={addAdvance}
          updateAdvance={updateAdvance}
          sendNotification={sendNotification}
        />
      )}
    </div>
  );
}

// ── Advance Modal ──────────────────────────────────────────────────────
interface ModalProps {
  editRecord: (AdvancePayment & { employee: Employee }) | null;
  employees: Employee[];
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  addAdvance: (p: { employee_id: string; amount: number; payment_mode: 'CASH'|'RTGS'; reason: string; payment_date: string; created_by: string }) => Promise<unknown>;
  updateAdvance: (id: string, p: Partial<AdvancePayment>) => Promise<void>;
  sendNotification: (payload: any, showToast?: boolean) => Promise<boolean>;
}

function AdvanceModal({ editRecord, employees, userId, onClose, onSuccess, addAdvance, updateAdvance, sendNotification }: ModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AdvanceFormValues>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      employee_id: editRecord?.employee_id || '',
      amount: editRecord?.amount || 0,
      payment_mode: editRecord?.payment_mode || 'CASH',
      reason: editRecord?.reason || '',
      payment_date: editRecord?.payment_date || new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: AdvanceFormValues) => {
    setLoading(true);
    try {
      if (editRecord) {
        await updateAdvance(editRecord.id, { amount: data.amount, payment_mode: data.payment_mode, reason: data.reason, payment_date: data.payment_date });
        toast.success('Advance updated!');
      } else {
        await addAdvance({ ...data, created_by: userId });
        toast.success('Advance added!');

        // Auto-send WhatsApp notification
        const emp = employees.find(e => e.id === data.employee_id);
        if (emp?.mobile_number) {
          try {
            const supabase = createClient();
            const { month, year } = getCurrentMonthYear();
            const { from, to } = getMonthRange(month, year);
            const { data: monthAtt } = await supabase.from('attendance').select('attendance_count').eq('employee_id', data.employee_id).gte('attendance_date', from).lte('attendance_date', to);
            const { data: monthAdv } = await supabase.from('advance_payments').select('amount').eq('employee_id', data.employee_id).gte('payment_date', from).lte('payment_date', to);
            const monthlyAtt = (monthAtt || []).reduce((s, r) => s + r.attendance_count, 0);
            const totalAdv = (monthAdv || []).reduce((s, r) => s + r.amount, 0);
            const gross = monthlyAtt * emp.rate_per_attendance;
            const payable = Math.max(0, gross - totalAdv);

            await sendNotification({
              type: 'advance',
              employeeName: emp.full_name,
              mobileNumber: emp.mobile_number,
              data: { amount: data.amount.toFixed(2), date: data.payment_date, payable: payable.toFixed(2) },
            });
          } catch {}
        }
      }
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  };

  const onError = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{editRecord ? 'Edit Advance' : 'Add Advance'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee *</label>
            <select {...register('employee_id')} disabled={!!editRecord} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60">
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.employee_code} — {e.full_name}</option>)}
            </select>
            {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input {...register('amount', { valueAsNumber: true })} type="number" min={1} step={0.01} placeholder="5000" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Mode *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="radio" value="CASH" {...register('payment_mode')} className="text-blue-600 focus:ring-blue-500" />
                Cash
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="radio" value="RTGS" {...register('payment_mode')} className="text-blue-600 focus:ring-blue-500" />
                RTGS / Online Transfer
              </label>
            </div>
            {errors.payment_mode && <p className="text-xs text-red-500 mt-1">{errors.payment_mode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Date *</label>
            <input {...register('payment_date')} type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.payment_date && <p className="text-xs text-red-500 mt-1">{errors.payment_date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
            <textarea {...register('reason')} rows={2} placeholder="Reason for advance…" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editRecord ? 'Update' : 'Save Advance'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
