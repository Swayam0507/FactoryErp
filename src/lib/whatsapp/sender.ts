import type { WhatsAppPayload } from '@/types';

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text: {
    body: string;
  };
}

function buildAttendanceMessage(data: Record<string, string | number>, employeeName: string): string {
  return `Hello ${employeeName}

Today's Attendance: ${data.todayAttendance}
Monthly Attendance: ${data.monthlyAttendance}
Current Salary: ₹${data.currentSalary}
Advance Taken: ₹${data.advance}
Payable Amount: ₹${data.payable}

Thank You.
— VivekBhai Industries`;
}

function buildAdvanceMessage(data: Record<string, string | number>, employeeName: string): string {
  return `Hello ${employeeName}

Advance Payment Recorded ✓
Amount: ₹${data.amount}
Date: ${data.date}
Remaining Payable Salary: ₹${data.payable}

Thank You.
— VivekBhai Industries`;
}

function buildSalaryMessage(data: Record<string, string | number>, employeeName: string): string {
  return `Hello ${employeeName}

Your Salary for ${data.month} ${data.year} has been generated.

Attendance: ${data.attendanceCount}
Gross Salary: ₹${data.grossSalary}
Advances Deducted: ₹${data.advances}
Net Final Salary: ₹${data.netSalary}

Thank You.
— VivekBhai Industries`;
}

export async function sendWhatsAppNotification(
  payload: WhatsAppPayload,
  phoneId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!phoneId || !token) {
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  // Clean phone number — remove spaces, +91 etc.
  const to = payload.mobileNumber.replace(/\D/g, '');
  const formattedTo = to.startsWith('91') ? to : `91${to}`;

  let body = '';
  switch (payload.type) {
    case 'attendance':
      body = buildAttendanceMessage(payload.data, payload.employeeName);
      break;
    case 'advance':
      body = buildAdvanceMessage(payload.data, payload.employeeName);
      break;
    case 'salary':
      body = buildSalaryMessage(payload.data, payload.employeeName);
      break;
  }

  const message: WhatsAppMessage = {
    messaging_product: 'whatsapp',
    to: formattedTo,
    type: 'text',
    text: { body },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err?.error?.message || 'WhatsApp API error',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
