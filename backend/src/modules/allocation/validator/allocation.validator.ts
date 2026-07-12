import { z } from "zod";

export const createAllocationSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  expectedReturnDate: z.string().optional().nullable(),
  purpose: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const approveAllocationSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(2000).optional(),
});

export const updateAllocationSchema = z.object({
  expectedReturnDate: z.string().optional().nullable(),
  purpose: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});
