'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Plus, Search, Filter, Download, Pencil, Trash2,
  UserCheck, UserX, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { exportEmployeesToExcel } from '@/lib/excel/exporters';
import type { Employee } from '@/types';

const PAGE_SIZE = 15;

export default function EmployeesPage() {
  const { employees, loading, deleteEmployee, updateEmployee } = useEmployees(true);
  const { canWrite, isSuperAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        !search ||
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        (e.mobile_number || '').includes(search);
      const matchesStatus =
        statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Delete employee "${emp.full_name}"? This cannot be undone.`)) return;
    setDeletingId(emp.id);
    try {
      await deleteEmployee(emp.id);
      toast.success(`${emp.full_name} deleted`);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeletingId(null);
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await updateEmployee(emp.id, { status: newStatus });
      toast.success(`${emp.full_name} marked as ${newStatus}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">{employees.length} total employees</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEmployeesToExcel(filtered)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {canWrite && (
            <Link
              href="/employees/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, code, mobile…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
            className="border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Mobile</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Joining Date</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Rate/Att.</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded skeleton-shimmer" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                paginated.map((emp, idx) => (
                  <tr key={emp.id} className="border-b border-slate-50 dark:border-slate-800/50 table-row-hover">
                    <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        {emp.employee_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 transition"
                      >
                        {emp.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{emp.mobile_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDate(emp.joining_date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                      {formatCurrency(emp.rate_per_attendance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                          >
                            {emp.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {canWrite && (
                          <Link
                            href={`/employees/${emp.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(emp)}
                            disabled={deletingId === emp.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                          >
                            {deletingId === emp.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
