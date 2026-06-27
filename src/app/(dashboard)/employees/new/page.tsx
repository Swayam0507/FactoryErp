'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema, type EmployeeFormValues } from '@/lib/validations/employee';
import { useEmployees } from '@/hooks/useEmployees';
import { todayStr } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewEmployeePage() {
  const router = useRouter();
  const { addEmployee } = useEmployees(true);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      status: 'active',
      joining_date: todayStr(),
      rate_per_attendance: 0,
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    setLoading(true);
    try {
      await addEmployee({
        employee_code: data.employee_code,
        full_name: data.full_name,
        mobile_number: data.mobile_number || null,
        address: data.address || null,
        joining_date: data.joining_date || null,
        rate_per_attendance: data.rate_per_attendance,
        status: data.status,
      });
      toast.success('Employee added successfully!');
      router.push('/employees');
    } catch (err) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/employees" className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Add Employee</h1>
          <p className="text-slate-500 text-sm">Fill in the employee details below</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                {...register('employee_code')}
                placeholder="EMP001"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
              {errors.employee_code && (
                <p className="text-xs text-red-500 mt-1">{errors.employee_code.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('full_name')}
                placeholder="Ramesh Kumar"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.full_name && (
                <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number
              </label>
              <input
                {...register('mobile_number')}
                placeholder="9876543210"
                maxLength={10}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.mobile_number && (
                <p className="text-xs text-red-500 mt-1">{errors.mobile_number.message}</p>
              )}
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Joining Date
              </label>
              <input
                {...register('joining_date')}
                type="date"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Rate per Attendance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rate per Attendance (₹) <span className="text-red-500">*</span>
              </label>
              <input
                {...register('rate_per_attendance', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
                placeholder="500"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.rate_per_attendance && (
                <p className="text-xs text-red-500 mt-1">{errors.rate_per_attendance.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              placeholder="Full address..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Employee
            </button>
            <Link
              href="/employees"
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
