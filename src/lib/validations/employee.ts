import { z } from 'zod';

export const employeeSchema = z.object({
  employee_code: z
    .string()
    .min(1, 'Employee code is required')
    .max(20, 'Code too long')
    .regex(/^[A-Z0-9]+$/, 'Only uppercase letters and numbers'),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  mobile_number: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number')
    .or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional().default(''),
  joining_date: z.string().optional().default(''),
  rate_per_attendance: z
    .number({ invalid_type_error: 'Rate must be a number' })
    .min(0, 'Rate cannot be negative')
    .max(100000, 'Rate too high'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
