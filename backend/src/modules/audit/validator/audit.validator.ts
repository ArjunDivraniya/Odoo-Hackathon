import { z } from "zod";
import { AuditStatus, AssetCondition, PriorityLevel } from "@prisma/client";
import {
  RESULT_STATUS,
  RESULT_STATUS_TO_DISCREPANCY,
  DISCREPANCY_TYPE_LOCATION_MISMATCH,
} from "../constants/audit.constants";

export const createAuditCycleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(5000).optional(),
  frequency: z.string().min(1, "Frequency is required").max(50),
  frequencyConfig: z.any().optional(),
  scope: z.any().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  nextAuditDate: z.string().optional(),
  autoAssign: z.boolean().optional(),
  metadata: z.any().optional(),
});

export const updateAuditCycleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  frequency: z.string().min(1).max(50).optional(),
  frequencyConfig: z.any().optional(),
  scope: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  nextAuditDate: z.string().optional(),
  isActive: z.boolean().optional(),
  autoAssign: z.boolean().optional(),
  metadata: z.any().optional(),
});

export const assignAuditorSchema = z.object({
  auditorId: z.string().uuid("Auditor ID must be a valid UUID"),
  officeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  assetCount: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
});

export const submitResultSchema = z.object({
  assetId: z.string().uuid("Asset ID must be a valid UUID"),
  status: z.string().min(1, "Status is required").max(30),
  condition: z.nativeEnum(AssetCondition).optional(),
  locationMatch: z.boolean().optional(),
  expectedLocation: z.string().max(300).optional(),
  actualLocation: z.string().max(300).optional(),
  notes: z.string().max(5000).optional(),
  photos: z.any().optional(),
  assignedTo: z.string().uuid().optional(),
});

export const verifyResultSchema = z.object({
  notes: z.string().max(5000).optional(),
});

export const listAuditQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  status: z.nativeEnum(AuditStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const searchAuditQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  status: z.nativeEnum(AuditStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const discrepancyReportQuerySchema = z.object({
  export: z.enum(["CSV", "EXCEL", "PDF", "JSON"]).optional(),
});

export const RESULT_STATUS_VALUES = Object.values(RESULT_STATUS);
export const DISCREPANCY_RESULT_STATUSES = Object.keys(RESULT_STATUS_TO_DISCREPANCY);
export const LOCATION_MISMATCH_TYPE = DISCREPANCY_TYPE_LOCATION_MISMATCH;
export const PRIORITY_LEVEL = PriorityLevel;
