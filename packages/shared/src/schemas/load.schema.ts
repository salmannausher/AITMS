import { z } from 'zod';

export const createLoadSchema = z.object({
  origin_city: z.string().min(1, 'Origin city is required'),
  origin_state: z.string().length(2, 'Must be a 2-letter state code'),
  dest_city: z.string().min(1, 'Destination city is required'),
  dest_state: z.string().length(2, 'Must be a 2-letter state code'),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional()
    .nullable(),
  rate: z.coerce.number().positive('Rate must be positive').optional().nullable(),
  load_type: z
    .enum(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK'])
    .optional()
    .nullable(),
  weight: z.coerce.number().int().positive().optional().nullable(),
  commodity: z.string().optional().nullable(),
  reference_number: z.string().optional().nullable(),
  estimated_miles: z.coerce.number().int().positive().optional().nullable(),
  broker_id: z.string().uuid().optional().nullable(),
  broker_name: z.string().optional().nullable(),
});

export type CreateLoadInput = z.infer<typeof createLoadSchema>;

export const assignLoadSchema = z.object({
  driver_id: z.string().uuid(),
  truck_id: z.string().uuid(),
});

export type AssignLoadInput = z.infer<typeof assignLoadSchema>;
