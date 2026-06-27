import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedReports() {
  console.log('Fetching workers...');
  const { data: workers, error: fetchError } = await supabase
    .from('employees')
    .select('id, rate_per_attendance')
    .limit(15);
    
  if (fetchError || !workers) {
    console.error('Error fetching workers:', fetchError);
    return;
  }

  console.log(`Found ${workers.length} workers.`);
  
  const today = new Date();
  let currentYear = today.getFullYear();
  let prevMonth = today.getMonth(); // This gives last month (1-12 index but JS is 0-11, so if current month is June (5), prevMonth is 5 i.e., May in 1-based index)
  
  if (prevMonth === 0) {
    prevMonth = 12;
    currentYear -= 1;
  }
  
  const prevPrevMonth = prevMonth === 1 ? 12 : prevMonth - 1;
  const prevPrevYear = prevMonth === 1 ? currentYear - 1 : currentYear;

  const reports = [];

  // Generate for previous month
  for (const worker of workers) {
    const total_attendance = Math.floor(Math.random() * 10) + 15; // 15 to 24 days
    const rate = worker.rate_per_attendance;
    const gross_salary = total_attendance * rate;
    const advance_amount = Math.random() > 0.5 ? Math.floor(Math.random() * 20) * 100 + 500 : 0;
    const final_salary = Math.max(0, gross_salary - advance_amount);

    reports.push({
      employee_id: worker.id,
      month: prevMonth,
      year: currentYear,
      total_attendance,
      rate,
      gross_salary,
      advance_amount,
      final_salary
    });
  }

  // Generate for month before previous
  for (const worker of workers) {
    const total_attendance = Math.floor(Math.random() * 10) + 15;
    const rate = worker.rate_per_attendance;
    const gross_salary = total_attendance * rate;
    const advance_amount = Math.random() > 0.5 ? Math.floor(Math.random() * 20) * 100 + 500 : 0;
    const final_salary = Math.max(0, gross_salary - advance_amount);

    reports.push({
      employee_id: worker.id,
      month: prevPrevMonth,
      year: prevPrevYear,
      total_attendance,
      rate,
      gross_salary,
      advance_amount,
      final_salary
    });
  }

  console.log(`Inserting ${reports.length} salary reports...`);
  const { error: repError } = await supabase.from('salary_reports').insert(reports);
  if (repError) {
    console.error('Error inserting salary reports:', repError);
  } else {
    console.log('Successfully seeded salary reports.');
  }
}

seedReports();
