'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface WhatsAppSettings {
  whatsapp_enabled: boolean;
  whatsapp_phone_id: string;
  whatsapp_token: string;
}

export function useWhatsApp() {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('factory_settings')
        .select('whatsapp_enabled')
        .single();
      setEnabled(!!data?.whatsapp_enabled);
      setLoaded(true);
    };
    fetchSettings();
  }, []);

  const openClickToChat = useCallback((payload: {
    type: 'attendance' | 'advance' | 'salary';
    employeeName: string;
    mobileNumber: string;
    data: Record<string, string | number>;
  }) => {
    if (!payload.mobileNumber) {
      toast.error('No mobile number available');
      return;
    }

    let message = '';
    const { employeeName, data } = payload;

    if (payload.type === 'attendance') {
      message = `Hello ${employeeName},\n\nYour attendance has been recorded.\nToday's Attendance: ${data.todayAttendance}\nTotal Monthly: ${data.monthlyAttendance}\n\nCurrent Salary: Rs. ${data.currentSalary}\nAdvances: Rs. ${data.advance}\n*Net Payable: Rs. ${data.payable}*\n\nThank you,\nVivekBhai Industries`;
    } else if (payload.type === 'advance') {
      message = `Hello ${employeeName},\n\nAn advance payment of Rs. ${data.amount} has been recorded.\nMode: ${data.mode}\nReason: ${data.reason}\n\nThank you,\nVivekBhai Industries`;
    } else if (payload.type === 'salary') {
      message = `Hello ${employeeName},\n\nYour Salary for ${data.month}/${data.year} has been generated.\n\nAttendance: ${data.attendanceCount}\nGross Salary: Rs. ${data.grossSalary}\nAdvances Deducted: Rs. ${data.advances}\n*Net Final Salary: Rs. ${data.netSalary}*\n\nThank you,\nVivekBhai Industries`;
    }

    // Format number for wa.me (remove spaces/pluses, ensure country code)
    let phone = payload.mobileNumber.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone; // Default to India if 10 digits

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }, []);

  const sendNotification = useCallback(async (payload: {
    type: 'attendance' | 'advance' | 'salary';
    employeeName: string;
    mobileNumber: string;
    data: Record<string, string | number>;
  }, showToast = true): Promise<boolean> => {
    if (!payload.mobileNumber) {
      if (showToast) toast.error('No mobile number available');
      return false;
    }
    
    if (!enabled) {
      openClickToChat(payload);
      return true;
    }

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (showToast) toast.success(`WhatsApp sent to ${payload.employeeName}`);
        return true;
      } else {
        if (showToast) toast.info(`Meta API failed, falling back to Click-to-Chat...`);
        openClickToChat(payload);
        return true;
      }
    } catch {
      if (showToast) toast.info('WhatsApp send failed, falling back to Click-to-Chat...');
      openClickToChat(payload);
      return true;
    }
  }, [enabled, openClickToChat]);

  return { enabled, loaded, sendNotification, openClickToChat };
}
