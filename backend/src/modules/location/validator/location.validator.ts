import { z } from "zod";

export const createLocationSchema = z.object({
  companyId: z.string().uuid("Invalid Company ID"),
  floorId: z.string().uuid("Invalid Floor ID").optional(),
  name: z.string().min(1, "Location name is required").max(200),
  code: z.string().min(1, "Location code is required").max(20),
  description: z.string().max(1000).optional(),
  locationType: z.string().max(50).optional(),
  capacity: z.number().int().positive().optional(),
  isBookable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateLocationSchema = createLocationSchema.partial().omit({ companyId: true, floorId: true });
