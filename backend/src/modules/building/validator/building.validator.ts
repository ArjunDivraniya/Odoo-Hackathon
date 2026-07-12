import { z } from "zod";

export const createBuildingSchema = z.object({
  companyId: z.string().uuid("Invalid Company ID"),
  officeId: z.string().uuid("Invalid Office ID"),
  name: z.string().min(1, "Building name is required").max(200),
  code: z.string().min(1, "Building code is required").max(20),
  description: z.string().max(1000).optional(),
  totalFloors: z.number().int().nonnegative().optional(),
  buildingType: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export const updateBuildingSchema = createBuildingSchema.partial().omit({ companyId: true, officeId: true });
