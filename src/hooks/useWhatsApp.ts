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

  const sendNotification = useCallback(async (payload: {
    type: 'attendance' | 'advance' | 'salary';
    employeeName: string;
    mobileNumber: string;
    data: Record<string, string | number>;
  }, showToast = true): Promise<boolean> => {
    if (!enabled || !payload.mobileNumber) return false;

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
        const err = await res.json();
        if (showToast) toast.error(`WhatsApp failed: ${err.error || 'Unknown error'}`);
        return false;
      }
    } catch {
      if (showToast) toast.error('WhatsApp send failed');
      return false;
    }
  }, [enabled]);

  return { enabled, loaded, sendNotification };
}
