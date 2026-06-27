import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppNotification } from '@/lib/whatsapp/sender';
import type { WhatsAppPayload } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload: WhatsAppPayload = await request.json();
  if (!payload.mobileNumber || !payload.type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Fetch WhatsApp settings
  const { data: settings } = await supabase
    .from('factory_settings')
    .select('whatsapp_phone_id, whatsapp_token, whatsapp_enabled')
    .single();

  if (!settings?.whatsapp_enabled) {
    return NextResponse.json({ error: 'WhatsApp notifications are disabled' }, { status: 400 });
  }

  const result = await sendWhatsAppNotification(
    payload,
    settings.whatsapp_phone_id,
    settings.whatsapp_token
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
