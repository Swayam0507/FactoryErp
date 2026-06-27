'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getCurrentMonthYear, getMonthRange } from '@/lib/utils';
import {
  Users, CalendarCheck, TrendingUp, IndianRupee,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import type { Employee, Attendance, AdvancePayment } from '@/types';

// Dynamically import recharts (heavy ~500KB library)
const LazyLineChart = dynamic(() => import('recharts').then(m => {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = m;
  // eslint-disable-next-line react/display-name
  return { default: ({ data }: { data: { day: string; count: number }[] }) => (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
        <Line type="monotone" dataKey="count" stroke="#1E3A8A" strokeWidth={2.5} dot={{ fill: '#1E3A8A', r: 3 }} activeDot={{ r: 5 }} name="Attendance" />
      </LineChart>
    </ResponsiveContainer>
  )};
}), { ssr: false, loading: () => <div className="h-[200px] skeleton-shimmer rounded-lg" /> });

const LazyPieChart = dynamic(() => import('recharts').then(m => {
  const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = m;
  const COLORS = ['#1E3A8A', '#10B981', '#F59E0B', '#EF4444'];
  // eslint-disable-next-line react/display-name
  return { default: ({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
          {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
        <Legend formatter={(v) => <span className="text-xs text-slate-500">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )};
}), { ssr: false, loading: () => <div className="h-[200px] skeleton-shimmer rounded-lg" /> });

interface KPI {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const { month, year } = getCurrentMonthYear();
  const { from, to } = getMonthRange(month, year);

  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    monthlyAttendance: 0,
    totalSalaryLiability: 0,
  });
  const [attendanceTrend, setAttendanceTrend] = useState<{ day: string; count: number }[]>([]);
  const [employeeStatus, setEmployeeStatus] = useState<{ name: string; value: number }[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<(Attendance & { employee: Employee })[]>([]);
  const [recentAdvances, setRecentAdvances] = useState<(AdvancePayment & { employee: Employee })[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  // Last 14 days range
  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - 13);
  const trendStartStr = trendStart.toISOString().split('T')[0];

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // All fetches in parallel - 5 queries total instead of 15+
      const [
        { count: total },
        { count: active },
        { data: todayAtt },
        { data: monthAtt },
        { data: employees },
        { data: advData },
        { data: trendAtt },
        { data: recAtt },
        { data: recAdv },
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('attendance').select('attendance_count').eq('attendance_date', today),
        supabase.from('attendance').select('attendance_count').gte('attendance_date', from).lte('attendance_date', to),
        supabase.from('employees').select('id, rate_per_attendance').eq('status', 'active'),
        supabase.from('advance_payments').select('amount').gte('payment_date', from).lte('payment_date', to),
        // Get ALL attendance for last 14 days in ONE query
        supabase.from('attendance').select('attendance_date, attendance_count').gte('attendance_date', trendStartStr).lte('attendance_date', today),
        supabase.from('attendance').select('*, employee:employees(*)').order('created_at', { ascending: false }).limit(8),
        supabase.from('advance_payments').select('*, employee:employees(*)').order('created_at', { ascending: false }).limit(8),
      ]);

      const todayTotal = (todayAtt || []).reduce((s, r) => s + r.attendance_count, 0);
      const monthTotal = (monthAtt || []).reduce((s, r) => s + r.attendance_count, 0);
      const totalAdv = (advData || []).reduce((s, r) => s + r.amount, 0);

      // Build attendance → rate map for salary calculation (no loop queries)
      const attByEmployee = new Map<string, number>();
      for (const row of monthAtt || []) {
        // We need per-employee attendance for salary - use a simpler estimate
        // (gross salary query from salary_reports if available, else estimate)
      }
      // Calculate salary liability from employees + monthAtt grouped
      const { data: monthAttDetailed } = await supabase
        .from('attendance')
        .select('employee_id, attendance_count')
        .gte('attendance_date', from)
        .lte('attendance_date', to);

      for (const row of monthAttDetailed || []) {
        attByEmployee.set(row.employee_id, (attByEmployee.get(row.employee_id) || 0) + row.attendance_count);
      }

      let liability = 0;
      for (const emp of employees || []) {
        const att = attByEmployee.get(emp.id) || 0;
        liability += att * emp.rate_per_attendance;
      }

      setKpis({
        totalEmployees: total || 0,
        activeEmployees: active || 0,
        todayAttendance: todayTotal,
        monthlyAttendance: monthTotal,
        totalSalaryLiability: Math.max(0, liability - totalAdv),
      });

      // Build 14-day trend from single bulk query
      const attByDate = new Map<string, number>();
      for (const row of trendAtt || []) {
        attByDate.set(row.attendance_date, (attByDate.get(row.attendance_date) || 0) + row.attendance_count);
      }
      const trend: { day: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trend.push({
          day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          count: attByDate.get(dateStr) || 0,
        });
      }
      setAttendanceTrend(trend);

      setEmployeeStatus([
        { name: 'Active', value: active || 0 },
        { name: 'Inactive', value: (total || 0) - (active || 0) },
      ]);

      setRecentAttendance((recAtt || []) as (Attendance & { employee: Employee })[]);
      setRecentAdvances((recAdv || []) as (AdvancePayment & { employee: Employee })[]);
      setLoading(false);
    };

    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpiCards: KPI[] = [
    {
      label: 'Total Employees',
      value: kpis.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: `${kpis.activeEmployees} active`,
    },
    {
      label: "Today's Attendance",
      value: kpis.todayAttendance,
      icon: CalendarCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      change: 'units marked today',
    },
    {
      label: 'Monthly Attendance',
      value: kpis.monthlyAttendance,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      change: 'this month total',
    },
    {
      label: 'Salary Liability',
      value: formatCurrency(kpis.totalSalaryLiability),
      icon: IndianRupee,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      change: 'net payable this month',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl skeleton-shimmer" />
          <div className="h-64 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back! Here's what's happening at the factory today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {kpi.change}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bgColor}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Attendance Trend (Last 14 Days)
          </h2>
          <LazyLineChart data={attendanceTrend} />
        </div>

        {/* Employee Status Pie */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Employee Status
          </h2>
          <LazyPieChart data={employeeStatus} />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Recent Attendance
            </h2>
          </div>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No attendance records yet</div>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0">
                    {rec.employee?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {rec.employee?.full_name}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(rec.attendance_date)}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                    {rec.attendance_count} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Advances */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Recent Advances
            </h2>
          </div>
          {recentAdvances.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No advance records yet</div>
          ) : (
            <div className="space-y-2">
              {recentAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
                    {adv.employee?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {adv.employee?.full_name}
                    </p>
                    <p className="text-xs text-slate-400">{adv.reason || 'No reason'}</p>
                  </div>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(adv.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
