import { z } from 'zod';

export const attendanceSchema = z.object({
  employee_id: z.string().uuid('Select a valid employee'),
  attendance_date: z.string().min(1, 'Date is required'),
  attendance_count: z
    .number({ invalid_type_error: 'Count must be a number' })
    .int('Must be a whole number')
    .min(0, 'Minimum is 0')
    .max(4, 'Maximum is 4 per day'),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;
