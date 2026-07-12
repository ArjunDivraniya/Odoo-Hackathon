import { z } from "zod";

export const createReturnSchema = z.object({
  allocationId: z.string().uuid(),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR", "NON_FUNCTIONAL"]),
  damageReport: z.any().optional(),
  missingItems: z.any().optional(),
  notes: z.string().max(2000).optional(),
  requiresRepair: z.boolean().optional(),
  photos: z.any().optional(),
});

export const verifyReturnSchema = z.object({
  verified: z.boolean(),
  notes: z.string().max(2000).optional(),
});
