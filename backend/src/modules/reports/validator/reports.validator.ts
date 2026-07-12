import { z } from "zod";
import {
  AssetStatus,
  AllocationStatus,
  MaintenanceStatus,
  AuditStatus,
  BookingStatus,
  PriorityLevel,
} from "@prisma/client";

const dateString = z.string().optional();

export const reportQuerySchema = z
  .object({
    status: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    officeId: z.string().uuid().optional(),
    condition: z.string().optional(),
    priority: z.nativeEnum(PriorityLevel).optional(),
    dateFrom: dateString,
    dateTo: dateString,
    export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
  })
  .passthrough();

export const metadataBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50),
  reportType: z.string().min(1).max(50),
  dataSource: z.string().max(100).optional(),
  filters: z.any().optional(),
  columns: z.any().optional(),
  groupBy: z.any().optional(),
  sortBy: z.any().optional(),
  chartConfig: z.any().optional(),
  isPublic: z.boolean().optional(),
  isScheduled: z.boolean().optional(),
  scheduleConfig: z.any().optional(),
});

export const metadataUpdateSchema = metadataBodySchema.partial();

export const metadataQuerySchema = z
  .object({
    category: z.string().optional(),
    reportType: z.string().optional(),
    search: z.string().optional(),
    export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
  })
  .passthrough();

export const generateQuerySchema = z
  .object({
    export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
  })
  .passthrough();

export const genericExportQuerySchema = z
  .object({
    type: z.enum([
      "asset",
      "maintenance",
      "audit",
      "department",
      "employee",
      "allocation",
      "utilization",
      "booking",
    ]),
    status: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    officeId: z.string().uuid().optional(),
    condition: z.string().optional(),
    priority: z.nativeEnum(PriorityLevel).optional(),
    dateFrom: dateString,
    dateTo: dateString,
    export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
  })
  .passthrough();

export {
  AssetStatus,
  AllocationStatus,
  MaintenanceStatus,
  AuditStatus,
  BookingStatus,
  PriorityLevel,
};
