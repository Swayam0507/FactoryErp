import type { Employee, Attendance, AdvancePayment, SalaryReport } from '@/types';
import { formatDate, formatCurrency, formatMonthYear } from '@/lib/utils';

async function getXLSX() {
  return await import('xlsx');
}

async function downloadWorkbook(wb: import('xlsx').WorkBook, filename: string) {
  const XLSX = await getXLSX();
  XLSX.writeFile(wb, filename);
}

// ── Employee List Export ──────────────────────────────────────
export async function exportEmployeesToExcel(employees: Employee[]) {
  const XLSX = await getXLSX();
  const data = employees.map((e, idx) => ({
    '#': idx + 1,
    'Employee Code': e.employee_code,
    'Full Name': e.full_name,
    'Mobile': e.mobile_number || '',
    'Address': e.address || '',
    'Joining Date': e.joining_date ? formatDate(e.joining_date) : '',
    'Rate / Attendance (₹)': e.rate_per_attendance,
    'Status': e.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 25 }, { wch: 14 },
    { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  downloadWorkbook(wb, 'employees.xlsx');
}

// ── Attendance Report Export ──────────────────────────────────
export async function exportAttendanceToExcel(
  records: (Attendance & { employee: Employee; marked_by?: { name: string; role: string } | null })[],
  label = 'Attendance Report'
) {
  const XLSX = await getXLSX();
  const data = records.map((a, idx) => ({
    '#': idx + 1,
    'Employee Code': a.employee?.employee_code || '',
    'Employee Name': a.employee?.full_name || '',
    'Date': formatDate(a.attendance_date),
    'Attendance Count': a.attendance_count,
    'Marked By': a.marked_by?.name || 'System',
    'Notes': a.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 4 }, { wch: 14 }, { wch: 25 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  downloadWorkbook(wb, `${label.replace(/ /g, '_')}.xlsx`);
}

// ── Advance Report Export ─────────────────────────────────────
export async function exportAdvancesToExcel(
  advances: (AdvancePayment & { employee: Employee })[],
  label = 'Advance Report'
) {
  const XLSX = await getXLSX();
  const data = advances.map((a, idx) => ({
    '#': idx + 1,
    'Employee Code': a.employee?.employee_code || '',
    'Employee Name': a.employee?.full_name || '',
    'Cash (₹)': (!a.payment_mode || a.payment_mode === 'CASH') ? a.amount : 0,
    'RTGS (₹)': a.payment_mode === 'RTGS' ? a.amount : 0,
    'Date': formatDate(a.payment_date),
    'Reason': a.reason || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 4 }, { wch: 14 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Advances');
  downloadWorkbook(wb, `${label.replace(/ /g, '_')}.xlsx`);
}

// ── Salary Report Export ──────────────────────────────────────
export async function exportSalaryToExcel(
  reports: (SalaryReport & { employee: Employee })[],
  month: number,
  year: number
) {
  const XLSX = await getXLSX();
  const label = formatMonthYear(month, year);

  const data = reports.map((r, idx) => ({
    '#': idx + 1,
    'Employee Code': r.employee?.employee_code || '',
    'Employee Name': r.employee?.full_name || '',
    'Attendance': r.total_attendance,
    'Rate (₹)': r.rate,
    'Gross Salary (₹)': r.gross_salary,
    'Cash Advance (₹)': r.advance_cash || 0,
    'RTGS Advance (₹)': r.advance_rtgs || 0,
    'Final Salary (₹)': r.final_salary,
    'Date': '',
    'Signature': '',
  }));

  // Add totals row
  const totalGross = reports.reduce((s, r) => s + r.gross_salary, 0);
  const totalCashAdv = reports.reduce((s, r) => s + (r.advance_cash || 0), 0);
  const totalRtgsAdv = reports.reduce((s, r) => s + (r.advance_rtgs || 0), 0);
  const totalFinal = reports.reduce((s, r) => s + r.final_salary, 0);

  data.push({
    '#': undefined as unknown as number,
    'Employee Code': '',
    'Employee Name': 'TOTAL',
    'Attendance': undefined as unknown as number,
    'Rate (₹)': undefined as unknown as number,
    'Gross Salary (₹)': totalGross,
    'Cash Advance (₹)': totalCashAdv,
    'RTGS Advance (₹)': totalRtgsAdv,
    'Final Salary (₹)': totalFinal,
    'Date': '',
    'Signature': '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 25 }, { wch: 12 },
    { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
    { wch: 15 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, label);
  downloadWorkbook(wb, `Salary_${label.replace(/ /g, '_')}.xlsx`);
}
