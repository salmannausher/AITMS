import { z } from 'zod';

export const truckTypeEnum = z.enum([
  'DRY_VAN',
  'REEFER',
  'FLATBED',
  'STEP_DECK',
  'LOWBOY',
  'TANKER',
  'OTHER',
]);

export const truckStatusEnum = z.enum(['AVAILABLE', 'IN_USE', 'OUT_OF_SERVICE']);

export const truckSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  unit_number: z.string().min(1),
  type: truckTypeEnum,
  year: z.number().int().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  vin: z.string().nullable(),
  status: truckStatusEnum,
  deleted_at: z.string().datetime().nullable(),
});

export const createTruckSchema = z.object({
  unit_number: z.string().min(1, 'Unit number is required'),
  type: truckTypeEnum,
  year: z.coerce.number().int().min(1980).max(2030).optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
});

export const updateTruckSchema = createTruckSchema.partial();

export type Truck = z.infer<typeof truckSchema>;
export type CreateTruckInput = z.infer<typeof createTruckSchema>;
export type UpdateTruckInput = z.infer<typeof updateTruckSchema>;
