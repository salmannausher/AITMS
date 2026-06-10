import { z } from 'zod';

export const carrierCostSettingsSchema = z.object({
  cost_per_mile: z.number().positive().max(10),
  fuel_cost_per_mile: z.number().positive().max(5),
  driver_pay_per_mile: z.number().positive().max(5),
  minimum_rpm: z.number().positive().max(20),
  home_state: z.string().length(2).toUpperCase(),
});

export type CarrierCostSettings = z.infer<typeof carrierCostSettingsSchema>;
