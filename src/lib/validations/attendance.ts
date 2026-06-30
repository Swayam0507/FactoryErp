import { z } from 'zod';

export const attendanceSchema = z.object({
  employee_id: z.string().uuid('Select a valid employee'),
  attendance_date: z.string().min(1, 'Date is required'),
  attendance_count: z
    .number({ invalid_type_error: 'Attendance count is required', required_error: 'Attendance count is required' })
    .multipleOf(0.5, 'Must be in increments of 0.5')
    .min(0, 'Minimum is 0')
    .max(4, 'Maximum is 4 per day'),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;
