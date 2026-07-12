import { z } from "zod";

export const createTransferSchema = z.object({
  companyId: z.string().uuid(),
  assetId: z.string().uuid(),
  fromOfficeId: z.string().uuid(),
  toOfficeId: z.string().uuid(),
  fromLocationId: z.string().uuid().optional().nullable(),
  toLocationId: z.string().uuid().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).optional(),
  reason: z.string().max(2000).optional(),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export const updateTransferSchema = createTransferSchema.partial().omit({ companyId: true, assetId: true });

export const approveTransferSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(2000).optional(),
  shippingTracking: z.string().max(100).optional(),
  shippingCarrier: z.string().max(50).optional(),
  shippingCost: z.number().min(0).optional(),
});

export const receiveTransferSchema = z.object({
  conditionAfter: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR", "NON_FUNCTIONAL"]),
  notes: z.string().max(2000).optional(),
});
