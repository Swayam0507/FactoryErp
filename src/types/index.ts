// ============================================================
// All TypeScript types for the Factory ERP System
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  mobile_number: string | null;
  address: string | null;
  joining_date: string | null;
  rate_per_attendance: number;
  status: EmployeeStatus;
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  attendance_count: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  employee?: Employee;
}

export interface AdvancePayment {
  id: string;
  employee_id: string;
  amount: number;
  payment_mode: 'CASH' | 'RTGS';
  reason: string | null;
  payment_date: string;
  created_by: string | null;
  created_at: string;
  employee?: Employee;
}

export interface SalaryReport {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  total_attendance: number;
  rate: number;
  gross_salary: number;
  advance_amount: number;
  advance_cash: number;
  advance_rtgs: number;
  final_salary: number;
  generated_by: string | null;
  generated_at: string;
  employee?: Employee;
}

export interface FactorySettings {
  id: number;
  factory_name: string;
  factory_address: string;
  logo_url: string;
  whatsapp_phone_id: string;
  whatsapp_token: string;
  whatsapp_enabled: boolean;
  updated_at: string;
}

// Form types
export interface EmployeeFormData {
  employee_code: string;
  full_name: string;
  mobile_number: string;
  address: string;
  joining_date: string;
  rate_per_attendance: number;
  status: EmployeeStatus;
}

export interface AttendanceFormData {
  employee_id: string;
  attendance_date: string;
  attendance_count: number;
  notes: string;
}

export interface AdvanceFormData {
  employee_id: string;
  amount: number;
  payment_mode: 'CASH' | 'RTGS';
  reason: string;
  payment_date: string;
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalEmployees: number;
  activeEmployees: number;
  todayAttendance: number;
  monthlyAttendance: number;
  totalSalaryLiability: number;
  totalAdvances: number;
}

// Salary computation
export interface SalaryCalculation {
  employee: Employee;
  month: number;
  year: number;
  totalAttendance: number;
  grossSalary: number;
  totalAdvance: number;
  advanceCash: number;
  advanceRtgs: number;
  finalSalary: number;
}

// WhatsApp notification types
export type WhatsAppNotificationType = 'attendance' | 'advance' | 'salary';

export interface WhatsAppPayload {
  type: WhatsAppNotificationType;
  employeeName: string;
  mobileNumber: string;
  data: Record<string, string | number>;
}

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Filter types
export interface DateRangeFilter {
  from: string | null;
  to: string | null;
}

export interface AttendanceFilters {
  employeeId: string | null;
  dateRange: DateRangeFilter;
  month: number | null;
  year: number | null;
}

export interface SalaryFilters {
  month: number;
  year: number;
  employeeId: string | null;
}
