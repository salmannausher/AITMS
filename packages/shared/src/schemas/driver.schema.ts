import { z } from 'zod';

export const cdlClassEnum = z.enum(['A', 'B', 'C']);
export const driverStatusEnum = z.enum(['AVAILABLE', 'ON_LOAD', 'OFF_DUTY']);

export const driverSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  full_name: z.string().min(1),
  phone: z.string().min(1),
  whatsapp_phone: z.string().nullable(),
  cdl_class: cdlClassEnum,
  endorsements: z.array(z.string()),
  home_city: z.string().min(1),
  home_state: z.string().length(2),
  hos_remaining_hours: z.number().min(0).max(70),
  hos_reset_at: z.string().datetime().nullable(),
  status: driverStatusEnum,
  assigned_truck_id: z.string().uuid().nullable(),
  deleted_at: z.string().datetime().nullable(),
});

export const createDriverSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  whatsapp_phone: z.string().optional().nullable(),
  cdl_class: cdlClassEnum,
  endorsements: z.array(z.string()).optional(),
  home_city: z.string().min(1, 'Home city is required'),
  home_state: z.string().length(2, 'Must be a 2-letter state code'),
  hos_remaining_hours: z.coerce.number().min(0).max(70).optional(),
  hos_reset_at: z.string().datetime().optional().nullable(),
  status: driverStatusEnum.optional(),
  assigned_truck_id: z.string().uuid().optional().nullable(),
});

export const updateDriverSchema = createDriverSchema.partial();

export const updateDriverStatusSchema = z.object({
  status: driverStatusEnum,
});

export const updateDriverHosSchema = z.object({
  hos_remaining_hours: z.coerce.number().min(0).max(70),
  hos_reset_at: z.string().datetime().optional(),
});

export type Driver = z.infer<typeof driverSchema>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;
export type UpdateDriverHosInput = z.infer<typeof updateDriverHosSchema>;
