import { z } from "zod";

export const createActivityLogSchema = z.object({
  companyId: z.string().uuid().optional(),
  userId: z.string().uuid().optional().nullable(),
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid().optional().nullable(),
  entityName: z.string().max(200).optional().nullable(),
  oldValue: z.any().optional().nullable(),
  newValue: z.any().optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
  userAgent: z.string().optional().nullable(),
  deviceInfo: z.any().optional().nullable(),
  requestId: z.string().max(100).optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  status: z.string().max(20).optional(),
  errorMessage: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export const listActivityLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
});
