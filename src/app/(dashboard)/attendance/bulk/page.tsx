'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { todayStr } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function BulkAttendancePage() {
  const { employees, loading: empLoading } = useEmployees(false); // active only
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [date, setDate] = useState(todayStr());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const setCount = (empId: string, val: number) => {
    setCounts((prev) => ({ ...prev, [empId]: Math.min(4, Math.max(0, val)) }));
  };

  // Quick-fill all
  const fillAll = (n: number) => {
    const next: Record<string, number> = {};
    employees.forEach((e) => { next[e.id] = n; });
    setCounts(next);
  };

  const handleSave = async () => {
    setSaving(true);
    let saved = 0;
    let errored = 0;

    for (const emp of employees) {
      const count = counts[emp.id];
      if (count === undefined) continue; // skip unmarked

      const { error } = await supabase.from('attendance').upsert(
        {
          employee_id: emp.id,
          attendance_date: date,
          attendance_count: count,
          created_by: user?.id,
        },
        { onConflict: 'employee_id,attendance_date' }
      );

      if (error) errored++;
      else saved++;
    }

    setSaving(false);
    if (errored === 0) {
      toast.success(`Attendance saved for ${saved} employees!`);
      router.push('/attendance');
    } else {
      toast.warning(`Saved ${saved}, failed ${errored}`);
    }
  };

  const markedCount = Object.keys(counts).filter((k) => counts[k] !== undefined).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/attendance" className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bulk Attendance Entry</h1>
          <p className="text-slate-500 text-sm">Mark attendance for all active employees at once</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quick Fill All</label>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => fillAll(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition ${
                    n === 0
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-sm text-slate-500">
            <span className="font-bold text-blue-600">{markedCount}</span> / {employees.length} marked
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-56">Attendance (0–4)</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {empLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(3)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-8 rounded skeleton-shimmer" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                employees.map((emp) => {
                  const count = counts[emp.id];
                  const marked = count !== undefined;
                  return (
                    <tr key={emp.id} className={`border-b border-slate-50 dark:border-slate-800/50 transition-colors ${marked ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{emp.full_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{emp.employee_code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Quick buttons */}
                          <div className="flex items-center gap-1">
                            {[0, 1, 2, 3, 4].map((n) => (
                              <button
                                key={n}
                                onClick={() => setCount(emp.id, n)}
                                className={`w-7 h-7 rounded text-xs font-bold transition ${
                                  count === n
                                    ? n === 0
                                      ? 'bg-red-500 text-white'
                                      : 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {marked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Link href="/attendance" className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 transition">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || markedCount === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save {markedCount > 0 ? `(${markedCount})` : ''} Records
        </button>
      </div>
    </div>
  );
}
