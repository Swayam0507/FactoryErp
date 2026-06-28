'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getCurrentMonthYear, getMonthRange } from '@/lib/utils';
import {
  Users, CalendarCheck, TrendingUp, IndianRupee,
  AlertCircle, ArrowUpRight, Wallet
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
        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, color: '#18181b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
        <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 3 }} activeDot={{ r: 5 }} name="Attendance" />
      </LineChart>
    </ResponsiveContainer>
  )};
}), { ssr: false, loading: () => <div className="h-[200px] skeleton-shimmer rounded-lg" /> });

const LazyPieChart = dynamic(() => import('recharts').then(m => {
  const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = m;
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
  // eslint-disable-next-line react/display-name
  return { default: ({ data }: { data: { name: string; value: number }[] }) => (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
          {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, color: '#18181b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
        <Legend formatter={(v) => <span className="text-xs text-zinc-500">{v}</span>} />
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
      bgColor: 'bg-indigo-50',
      change: `${kpis.activeEmployees} active`,
    },
    {
      label: "Today's Attendance",
      value: kpis.todayAttendance,
      icon: CalendarCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: 'units marked today',
    },
    {
      label: 'Monthly Attendance',
      value: kpis.monthlyAttendance,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: 'this month total',
    },
    {
      label: 'Salary Liability',
      value: formatCurrency(kpis.totalSalaryLiability),
      icon: IndianRupee,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
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
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Welcome back! Here's what's happening at the factory today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="glass-card rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{kpi.label}</p>
                <p className="text-3xl font-bold text-zinc-900 mt-1.5 tracking-tight">{kpi.value}</p>
                <p className="text-xs font-medium text-zinc-400 mt-2 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {kpi.change}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${kpi.bgColor} shadow-inner`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h2 className="text-base font-bold text-zinc-900 mb-6">
            Attendance Trend (Last 14 Days)
          </h2>
          <LazyLineChart data={attendanceTrend} />
        </div>

        {/* Employee Status Pie */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-base font-bold text-zinc-900 mb-6">
            Employee Status
          </h2>
          <LazyPieChart data={employeeStatus} />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-zinc-900">
              Recent Attendance
            </h2>
          </div>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-sm">No attendance records yet</div>
          ) : (
            <div className="space-y-1">
              {recentAttendance.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold shrink-0">
                    {rec.employee?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">
                      {rec.employee?.full_name}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(rec.attendance_date)}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    {rec.attendance_count} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Advances */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Wallet className="w-4 h-4 text-rose-600" />
            </div>
            <h2 className="text-base font-bold text-zinc-900">
              Recent Advances
            </h2>
          </div>
          {recentAdvances.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-sm">No recent advances</div>
          ) : (
            <div className="space-y-1">
              {recentAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-sm font-bold shrink-0">
                    {adv.employee?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {adv.employee?.full_name}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium truncate">
                      {new Date(adv.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900">
                      {formatCurrency(adv.amount)}
                    </p>
                    <p className="text-xs font-semibold text-zinc-400">{adv.payment_mode}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
