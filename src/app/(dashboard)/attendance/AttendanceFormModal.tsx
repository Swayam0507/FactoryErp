'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attendanceSchema, type AttendanceFormValues } from '@/lib/validations/attendance';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useAttendance } from '@/hooks/useAttendance';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { todayStr, getCurrentMonthYear, getMonthRange } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import type { Attendance, Employee } from '@/types';

interface Props {
  editRecord: (Attendance & { employee: Employee }) | null;
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AttendanceFormModal({ editRecord, employees, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { sendNotification } = useWhatsApp();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      employee_id: editRecord?.employee_id || '',
      attendance_date: editRecord?.attendance_date || todayStr(),
      attendance_count: editRecord ? editRecord.attendance_count : ('' as unknown as number),
      notes: editRecord?.notes || '',
    },
  });

  const count = watch('attendance_count');

  const onSubmit = async (data: AttendanceFormValues) => {
    setLoading(true);
    try {
      const payload = {
        employee_id: data.employee_id,
        attendance_date: data.attendance_date,
        attendance_count: data.attendance_count,
        notes: data.notes || null,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'employee_id,attendance_date' });

      if (error) throw new Error(error.message);
      toast.success(editRecord ? 'Attendance updated!' : 'Attendance marked!');

      // Auto-send WhatsApp notification
      const emp = employees.find(e => e.id === data.employee_id);
      if (emp?.mobile_number) {
        try {
          const { month, year } = getCurrentMonthYear();
          const { from, to } = getMonthRange(month, year);
          // Fetch monthly totals for this employee
          const { data: monthAtt } = await supabase
            .from('attendance')
            .select('attendance_count')
            .eq('employee_id', data.employee_id)
            .gte('attendance_date', from)
            .lte('attendance_date', to);
          const { data: monthAdv } = await supabase
            .from('advance_payments')
            .select('amount')
            .eq('employee_id', data.employee_id)
            .gte('payment_date', from)
            .lte('payment_date', to);
          
          const monthlyAttendance = (monthAtt || []).reduce((s, r) => s + r.attendance_count, 0);
          const totalAdvance = (monthAdv || []).reduce((s, r) => s + r.amount, 0);
          const currentSalary = monthlyAttendance * emp.rate_per_attendance;
          const payable = Math.max(0, currentSalary - totalAdvance);

          await sendNotification({
            type: 'attendance',
            employeeName: emp.full_name,
            mobileNumber: emp.mobile_number,
            data: {
              todayAttendance: data.attendance_count,
              monthlyAttendance,
              currentSalary: currentSalary.toFixed(2),
              advance: totalAdvance.toFixed(2),
              payable: payable.toFixed(2),
            },
          });
        } catch {}
      }

      onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {editRecord ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              {...register('employee_id')}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.employee_code} — {e.full_name}</option>
              ))}
            </select>
            {errors.employee_id && <p className="text-xs text-red-500 mt-1">{errors.employee_id.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('attendance_date')}
              type="date"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.attendance_date && <p className="text-xs text-red-500 mt-1">{errors.attendance_date.message}</p>}
          </div>

          {/* Attendance Count */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Attendance Count (0–4) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                {...register('attendance_count', { valueAsNumber: true })}
                type="number"
                step="0.5"
                min={0}
                max={4}
                className="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Visual blocks */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`w-7 h-7 rounded transition-all duration-200 ${
                      n <= Math.floor(count || 0)
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                ))}
                
                {/* Half Day Button */}
                <button
                  type="button"
                  onClick={() => {
                    const current = count || 0;
                    const fulls = Math.floor(current);
                    const isHalf = current % 1 !== 0;
                    setValue('attendance_count', isHalf ? fulls : fulls + 0.5, { shouldValidate: true });
                  }}
                  title="Half Day (+0.5)"
                  className={`w-7 h-7 rounded transition-all duration-200 border-2 border-dashed flex items-center justify-center text-xs font-bold ${
                    (count || 0) % 1 !== 0
                      ? 'bg-amber-400 border-amber-400 text-amber-900 shadow-sm shadow-amber-200'
                      : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-amber-400'
                  }`}
                >
                  ½
                </button>
              </div>
            </div>
            {errors.attendance_count && <p className="text-xs text-red-500 mt-1">{errors.attendance_count.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editRecord ? 'Update' : 'Save Attendance'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
