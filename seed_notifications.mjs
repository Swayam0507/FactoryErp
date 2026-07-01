import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSeed() {
  console.log('--- SEEDING DUMMY NOTIFICATIONS ---');
  
  const notifications = [
    {
      type: 'info',
      title: 'Manager Activity',
      message: 'Manager Ramesh modified an attendance record for Employee Raju (EMP002).',
      target_role: 'all'
    },
    {
      type: 'warning',
      title: 'High Advance Alert',
      message: 'Employee Mukesh has taken ₹15,000 in advances this month, exceeding their accrued salary of ₹12,000.',
      target_role: 'super_admin'
    },
    {
      type: 'alert',
      title: 'WhatsApp Delivery Failed',
      message: 'Could not send salary notification to Employee Suresh. Number may be invalid.',
      target_role: 'all'
    }
  ];

  const { error } = await supabase.from('notifications').insert(notifications);
  
  if (error) {
    console.error('Error inserting notifications:', error);
  } else {
    console.log('Successfully inserted 3 dummy notifications.');
  }
}

runSeed().catch(err => {
  console.error("SEED SCRIPT ERROR:", err);
});
