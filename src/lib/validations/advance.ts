import { z } from 'zod';

export const advanceSchema = z.object({
  employee_id: z.string().uuid('Select a valid employee'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  payment_mode: z.enum(['CASH', 'RTGS'], {
    invalid_type_error: 'Select a valid payment mode',
  }).default('CASH'),
  reason: z.string().max(500, 'Reason too long').optional().default(''),
  payment_date: z.string().min(1, 'Payment date is required'),
});

export type AdvanceFormValues = z.infer<typeof advanceSchema>;
