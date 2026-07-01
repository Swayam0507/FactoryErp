// ──────────────────────────────────────────────────────────────
// Pure JS date utilities — no external dependencies
// ──────────────────────────────────────────────────────────────

// Format currency in INR
export function formatCurrency(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount);
}

// Format date to readable string e.g. "23 Jun 2026"
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Format month/year e.g. "June 2026"
export function formatMonthYear(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// Get month name e.g. "June"
export function getMonthName(month: number): string {
  const d = new Date(2024, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long' });
}

// Get first and last day of a month as YYYY-MM-DD strings
export function getMonthRange(month: number, year: number): { from: string; to: string } {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // day 0 of next month = last day of this month
  return {
    from: toDateStr(firstDay),
    to: toDateStr(lastDay),
  };
}

// Convert Date to YYYY-MM-DD string
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Generate employee code
export function generateEmployeeCode(index: number): string {
  return `EMP${String(index).padStart(3, '0')}`;
}

// Get current month and year
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Today as YYYY-MM-DD
export function todayStr(): string {
  return toDateStr(new Date());
}

// Capitalize first letter
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Truncate long text
export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

// Calculate salary
export function calculateSalary(
  totalAttendance: number,
  rate: number,
  totalAdvance: number
): { grossSalary: number; finalSalary: number } {
  const grossSalary = totalAttendance * rate;
  const finalSalary = Math.max(0, grossSalary - totalAdvance);
  return { grossSalary, finalSalary };
}

// Get list of years (last 5 years + current)
export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
}

// Get months list
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// cn utility
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Debounce
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
