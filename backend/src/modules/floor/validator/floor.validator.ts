import { z } from "zod";

export const createFloorSchema = z.object({
  companyId: z.string().uuid("Invalid Company ID"),
  buildingId: z.string().uuid("Invalid Building ID"),
  name: z.string().min(1, "Floor name is required").max(100),
  levelNumber: z.number().int("Level number must be an integer"),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updateFloorSchema = createFloorSchema.partial().omit({ companyId: true, buildingId: true });
