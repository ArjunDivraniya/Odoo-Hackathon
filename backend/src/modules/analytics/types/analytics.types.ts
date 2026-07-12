import { z } from "zod";
import {
  AssetStatus,
  AllocationStatus,
  MaintenanceStatus,
  AuditStatus,
  BookingStatus,
  PriorityLevel,
} from "@prisma/client";

export type AnalyticsMetric =
  | "count"
  | "sum"
  | "avg";

export interface CustomAnalyticsQuery {
  metric: string;
  groupBy: string;
  status?: string;
  categoryId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const analyticsQuerySchema = z
  .object({
    idleDays: z.coerce.number().int().positive().optional(),
    year: z.coerce.number().int().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    status: z.string().optional(),
    export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
  })
  .passthrough();

export const customAnalyticsSchema = z
  .object({
    metric: z.enum(["count", "sum", "avg"]).default("count"),
    groupBy: z.enum([
      "status",
      "condition",
      "category",
      "department",
      "office",
      "priority",
      "type",
    ]),
    field: z.string().optional(),
    status: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
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
