import { z } from "zod";

export const createResourceSchema = z.object({
  companyId: z.string().uuid(),
  assetId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Resource name is required").max(200),
  description: z.string().max(2000).optional(),
  resourceType: z.string().min(1, "Resource type is required").max(50),
  capacity: z.number().int().positive().optional(),
  officeId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  isBookable: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  maxBookingDurationHours: z.number().int().positive().optional().nullable(),
  bookingRules: z.any().optional(),
  operatingHours: z.any().optional(),
});

export const updateResourceSchema = createResourceSchema.partial().omit({ companyId: true });
