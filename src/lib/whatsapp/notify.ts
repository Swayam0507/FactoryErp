/**
 * Client-side helper to trigger WhatsApp notifications via the API route.
 * Call this after attendance/advance/salary events.
 */

interface AttendanceNotifData {
  employeeName: string;
  mobileNumber: string;
  todayAttendance: number;
  monthlyAttendance: number;
  currentSalary: number;
  advance: number;
  payable: number;
}

interface AdvanceNotifData {
  employeeName: string;
  mobileNumber: string;
  amount: number;
  date: string;
  payable: number;
}

interface SalaryNotifData {
  employeeName: string;
  mobileNumber: string;
  month: string;
  attendance: number;
  gross: number;
  advance: number;
  final: number;
}

async function callWhatsAppApi(payload: {
  type: 'attendance' | 'advance' | 'salary';
  employeeName: string;
  mobileNumber: string;
  data: Record<string, string | number>;
}): Promise<boolean> {
  if (!payload.mobileNumber) return false;

  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendAttendanceNotification(data: AttendanceNotifData): Promise<boolean> {
  return callWhatsAppApi({
    type: 'attendance',
    employeeName: data.employeeName,
    mobileNumber: data.mobileNumber,
    data: {
      todayAttendance: data.todayAttendance,
      monthlyAttendance: data.monthlyAttendance,
      currentSalary: data.currentSalary.toFixed(2),
      advance: data.advance.toFixed(2),
      payable: data.payable.toFixed(2),
    },
  });
}

export async function sendAdvanceNotification(data: AdvanceNotifData): Promise<boolean> {
  return callWhatsAppApi({
    type: 'advance',
    employeeName: data.employeeName,
    mobileNumber: data.mobileNumber,
    data: {
      amount: data.amount.toFixed(2),
      date: data.date,
      payable: data.payable.toFixed(2),
    },
  });
}

export async function sendSalaryNotification(data: SalaryNotifData): Promise<boolean> {
  return callWhatsAppApi({
    type: 'salary',
    employeeName: data.employeeName,
    mobileNumber: data.mobileNumber,
    data: {
      month: data.month,
      attendance: data.attendance,
      gross: data.gross.toFixed(2),
      advance: data.advance.toFixed(2),
      final: data.final.toFixed(2),
    },
  });
}
