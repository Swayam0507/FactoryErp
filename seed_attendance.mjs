import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedAdditionalData() {
  console.log('Fetching workers...');
  const { data: workers, error: fetchError } = await supabase
    .from('employees')
    .select('id')
    .limit(15);
    
  if (fetchError || !workers) {
    console.error('Error fetching workers:', fetchError);
    return;
  }

  console.log(`Found ${workers.length} workers.`);
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // Current month (0-indexed)
  
  const attendances = [];
  const advances = [];

  for (const worker of workers) {
    // Add 10-15 random attendances in the current month
    const numAttendances = Math.floor(Math.random() * 6) + 10;
    const days = new Set();
    while(days.size < numAttendances) {
      days.add(Math.floor(Math.random() * 28) + 1);
    }
    
    for (const day of days) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      attendances.push({
        employee_id: worker.id,
        attendance_date: dateStr,
        attendance_count: Math.random() > 0.8 ? 2 : 1 // 1 for full, maybe 2 for half depending on system, using integers
      });
    }

    // Add 1 advance payment for about half of them
    if (Math.random() > 0.5) {
      const advanceDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      advances.push({
        employee_id: worker.id,
        amount: Math.floor(Math.random() * 20) * 100 + 500, // 500 to 2500
        payment_mode: Math.random() > 0.5 ? 'CASH' : 'RTGS',
        reason: 'Dummy advance',
        payment_date: advanceDateStr
      });
    }
  }

  console.log(`Inserting ${attendances.length} attendances...`);
  const { error: attError } = await supabase.from('attendance').upsert(attendances, { onConflict: 'employee_id,attendance_date', ignoreDuplicates: true });
  if (attError) console.error('Error inserting attendance:', attError);

  console.log(`Inserting ${advances.length} advances...`);
  const { error: advError } = await supabase.from('advance_payments').insert(advances);
  if (advError) console.error('Error inserting advances:', advError);

  if (!attError && !advError) {
    console.log('Successfully seeded attendance and advances.');
  }
}

seedAdditionalData();
