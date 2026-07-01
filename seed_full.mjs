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
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSeed() {
  console.log('--- STARTING WIPE & SEED ---');
  
  console.log('Wiping existing admins and employees...');
  await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error: delEmpError } = await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delEmpError) {
    console.error('Error deleting employees:', delEmpError);
  }
  
  const usersToCreate = [
    { email: 'superadmin@vivekbhai.com', password: 'password123', name: 'Vivek Bhai', role: 'super_admin' },
    { email: 'manager@vivekbhai.com', password: 'password123', name: 'Ramesh Manager', role: 'admin' },
    { email: 'viewer@vivekbhai.com', password: 'password123', name: 'Amit Viewer', role: 'viewer' }
  ];

  const adminRecords = [];
  
  console.log('Setting up Auth Users & Admins...');
  for (const u of usersToCreate) {
    let { data: users } = await supabase.auth.admin.listUsers();
    let existingUser = users.users.find(x => x.email === u.email);
    
    let userId;
    if (existingUser) {
      console.log('User ' + u.email + ' already exists. Updating password...');
      await supabase.auth.admin.updateUserById(existingUser.id, { password: u.password, email_confirm: true });
      userId = existingUser.id;
    } else {
      console.log('Creating user ' + u.email + '...');
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true
      });
      if (createErr) throw createErr;
      userId = newUser.user.id;
    }
    
    adminRecords.push({
      id: userId,
      email: u.email,
      name: u.name,
      role: u.role
    });
  }

  const { error: adminErr } = await supabase.from('admins').upsert(adminRecords, { onConflict: 'id' });
  if (adminErr) throw adminErr;
  
  console.log('Admins inserted successfully.');

  const superAdminId = adminRecords.find(a => a.role === 'super_admin').id;
  const managerId = adminRecords.find(a => a.role === 'admin').id;

  console.log('Seeding 15 dummy employees...');
  const dummyWorkers = [
    { employee_code: 'W001', full_name: 'Amit Patel', mobile_number: '9876543210', address: 'Ahmedabad, Gujarat', joining_date: '2023-01-15', rate_per_attendance: 500, status: 'active' },
    { employee_code: 'W002', full_name: 'Rahul Sharma', mobile_number: '9876543211', address: 'Surat, Gujarat', joining_date: '2023-02-10', rate_per_attendance: 450, status: 'active' },
    { employee_code: 'W003', full_name: 'Vikram Singh', mobile_number: '9876543212', address: 'Vadodara, Gujarat', joining_date: '2023-03-05', rate_per_attendance: 480, status: 'active' },
    { employee_code: 'W004', full_name: 'Suresh Kumar', mobile_number: '9876543213', address: 'Rajkot, Gujarat', joining_date: '2023-04-20', rate_per_attendance: 400, status: 'active' },
    { employee_code: 'W005', full_name: 'Manish Desai', mobile_number: '9876543214', address: 'Gandhinagar, Gujarat', joining_date: '2023-05-12', rate_per_attendance: 550, status: 'active' },
    { employee_code: 'W006', full_name: 'Ramesh Gupta', mobile_number: '9876543215', address: 'Bhavnagar, Gujarat', joining_date: '2023-06-18', rate_per_attendance: 420, status: 'active' },
    { employee_code: 'W007', full_name: 'Karan Mehta', mobile_number: '9876543216', address: 'Jamnagar, Gujarat', joining_date: '2023-07-22', rate_per_attendance: 460, status: 'active' },
    { employee_code: 'W008', full_name: 'Anil Joshi', mobile_number: '9876543217', address: 'Junagadh, Gujarat', joining_date: '2023-08-01', rate_per_attendance: 490, status: 'active' },
    { employee_code: 'W009', full_name: 'Deepak Shah', mobile_number: '9876543218', address: 'Anand, Gujarat', joining_date: '2023-09-14', rate_per_attendance: 520, status: 'active' },
    { employee_code: 'W010', full_name: 'Sanjay Vaghela', mobile_number: '9876543219', address: 'Navsari, Gujarat', joining_date: '2023-10-30', rate_per_attendance: 430, status: 'active' },
    { employee_code: 'W011', full_name: 'Prakash Rathod', mobile_number: '9876543220', address: 'Surendranagar, Gujarat', joining_date: '2023-11-05', rate_per_attendance: 470, status: 'active' },
    { employee_code: 'W012', full_name: 'Gaurav Solanki', mobile_number: '9876543221', address: 'Bharuch, Gujarat', joining_date: '2023-12-11', rate_per_attendance: 510, status: 'active' },
    { employee_code: 'W013', full_name: 'Chetan Parmar', mobile_number: '9876543222', address: 'Vapi, Gujarat', joining_date: '2024-01-25', rate_per_attendance: 440, status: 'active' },
    { employee_code: 'W014', full_name: 'Hitesh Chauhan', mobile_number: '9876543223', address: 'Patan, Gujarat', joining_date: '2024-02-17', rate_per_attendance: 480, status: 'active' },
    { employee_code: 'W015', full_name: 'Jignesh Makwana', mobile_number: '9876543224', address: 'Amreli, Gujarat', joining_date: '2024-03-09', rate_per_attendance: 530, status: 'active' }
  ];

  const { data: employees, error: empErr } = await supabase.from('employees').insert(dummyWorkers).select();
  if (empErr) throw empErr;

  console.log('Inserted ' + employees.length + ' employees.');

  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = today.getMonth(); 
  
  const attendances = [];
  const advances = [];
  
  for (const emp of employees) {
    const numAttendances = Math.floor(Math.random() * 10) + 15;
    const days = new Set();
    while(days.size < numAttendances) {
      days.add(Math.floor(Math.random() * 28) + 1);
    }
    
    for (const day of days) {
      const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const createdBy = Math.random() > 0.5 ? superAdminId : managerId;
      
      attendances.push({
        employee_id: emp.id,
        attendance_date: dateStr,
        attendance_count: Math.random() > 0.8 ? 2 : 1,
        created_by: createdBy
      });
    }

    if (Math.random() > 0.3) {
      const advanceDateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      advances.push({
        employee_id: emp.id,
        amount: Math.floor(Math.random() * 20) * 100 + 500, 
        payment_mode: Math.random() > 0.5 ? 'CASH' : 'RTGS',
        reason: 'Monthly expense advance',
        payment_date: advanceDateStr,
        created_by: superAdminId
      });
    }
  }

  console.log('Inserting ' + attendances.length + ' attendance records...');
  const { error: attErr } = await supabase.from('attendance').upsert(attendances, { onConflict: 'employee_id,attendance_date', ignoreDuplicates: true });
  if (attErr) throw attErr;

  console.log('Inserting ' + advances.length + ' advance records...');
  const { error: advErr } = await supabase.from('advance_payments').insert(advances);
  if (advErr) throw advErr;

  let prevMonth = currentMonth; 
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  
  const reports = [];
  for (const emp of employees) {
    const total_attendance = Math.floor(Math.random() * 10) + 15;
    const rate = emp.rate_per_attendance;
    const gross_salary = total_attendance * rate;
    const advance_amount = Math.random() > 0.5 ? Math.floor(Math.random() * 20) * 100 + 500 : 0;
    const final_salary = Math.max(0, gross_salary - advance_amount);

    reports.push({
      employee_id: emp.id,
      month: prevMonth,
      year: prevYear,
      total_attendance,
      rate,
      gross_salary,
      advance_amount,
      advance_cash: advance_amount,
      advance_rtgs: 0,
      final_salary,
      generated_by: superAdminId
    });
  }

  console.log('Inserting ' + reports.length + ' salary reports for previous month...');
  const { error: repErr } = await supabase.from('salary_reports').insert(reports);
  if (repErr) throw repErr;

  console.log('--- ALL DATA SEEDED SUCCESSFULLY ---');
}

runSeed().catch(err => {
  console.error("SEED SCRIPT ERROR:", err);
});
