import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function seedData() {
  console.log('Seeding dummy workers...');
  
  const { data, error } = await supabase
    .from('employees')
    .insert(dummyWorkers)
    .select();

  if (error) {
    console.error('Error inserting workers:', error);
  } else {
    console.log(`Successfully inserted ${data.length} workers.`);
  }
}

seedData();
