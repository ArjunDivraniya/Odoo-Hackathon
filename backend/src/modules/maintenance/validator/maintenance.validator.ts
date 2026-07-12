import { z } from "zod";
import { MaintenanceStatus, PriorityLevel } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  assetId: z.string().uuid("Valid asset id is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  type: z.string().max(50).optional(),
  estimatedCost: z.union([z.number(), z.string()]).optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
  vendorId: z.string().uuid().optional().nullable(),
  externalRef: z.string().max(100).optional(),
  metadata: z.any().optional(),
});

export const updateMaintenanceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  type: z.string().max(50).optional(),
  scheduledDate: z.string().optional().nullable(),
  estimatedCost: z.union([z.number(), z.string()]).optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export const approveMaintenanceSchema = z.object({});

export const rejectMaintenanceSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required").max(2000),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid("Valid technician id is required"),
  role: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus),
  reason: z.string().max(2000).optional(),
});

export const completeMaintenanceSchema = z.object({
  actualCost: z.union([z.number(), z.string()]).optional().nullable(),
  resolution: z.string().max(2000).optional(),
  downtimeHours: z.union([z.number(), z.string()]).optional().nullable(),
  rootCause: z.string().max(2000).optional(),
});

export const addAttachmentSchema = z.object({
  fileId: z.string().uuid().optional().nullable(),
  attachmentType: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

export const maintenanceListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  assetId: z.string().uuid().optional(),
  requestedBy: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export const maintenanceSearchQuerySchema = maintenanceListQuerySchema.extend({
  q: z.string().optional(),
});
