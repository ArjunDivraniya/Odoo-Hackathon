import { PriorityLevel } from "@prisma/client";
import { SearchEntityType, CommonFilterParams } from "../types/search.types";

export const ALL_SEARCH_TYPES: SearchEntityType[] = [
  "asset",
  "employee",
  "department",
  "maintenance",
  "audit",
  "notification",
  "report",
  "file",
];

export const SEARCH_RESULT_LIMIT = 10;

export const SEARCH_CACHE_TTL = 60;

/**
 * buildCommonFilters
 * ---------------------------------------------------------------------------
 * Pure helper that builds a reusable Prisma `where` fragment from common
 * cross-entity filter parameters. It is intentionally entity-agnostic: callers
 * spread only the keys that are valid for the target model (Prisma will reject
 * unknown top-level keys, so consumers MUST select the relevant fields).
 *
 * Supported keys (all optional):
 *   - status        : string equality (e.g. AssetStatus / MaintenanceStatus)
 *   - priority      : string equality on PriorityLevel
 *   - departmentId  : string equality on a `departmentId` column
 *   - dateFrom     : ISO date string -> createdAt >= dateFrom
 *   - dateTo       : ISO date string -> createdAt <= dateTo
 *   - userId       : string equality on an owner/creator column
 *   - technicianId : string equality on a technician/assignee column
 *   - auditCycleId : string equality on an audit cycle column
 *
 * Returns a plain object (subset of the above keys). Date strings are parsed
 * into `Date` instances and placed under a `createdAt` range when present.
 */
export function buildCommonFilters(query: CommonFilterParams | Record<string, any>): Record<string, any> {
  const filters: Record<string, any> = {};

  if (query.status !== undefined && query.status !== null && query.status !== "") {
    filters.status = query.status;
  }

  if (query.priority !== undefined && query.priority !== null && query.priority !== "") {
    const priority = query.priority;
    filters.priority = (PriorityLevel as Record<string, string>)[priority] ?? priority;
  }

  if (query.departmentId !== undefined && query.departmentId !== null && query.departmentId !== "") {
    filters.departmentId = query.departmentId;
  }

  if (query.userId !== undefined && query.userId !== null && query.userId !== "") {
    filters.userId = query.userId;
  }

  if (query.technicianId !== undefined && query.technicianId !== null && query.technicianId !== "") {
    filters.technicianId = query.technicianId;
  }

  if (query.auditCycleId !== undefined && query.auditCycleId !== null && query.auditCycleId !== "") {
    filters.auditCycleId = query.auditCycleId;
  }

  const dateFilter: Record<string, Date> = {};
  if (query.dateFrom !== undefined && query.dateFrom !== null && query.dateFrom !== "") {
    const parsed = new Date(query.dateFrom);
    if (!isNaN(parsed.getTime())) {
      dateFilter.gte = parsed;
    }
  }
  if (query.dateTo !== undefined && query.dateTo !== null && query.dateTo !== "") {
    const parsed = new Date(query.dateTo);
    if (!isNaN(parsed.getTime())) {
      dateFilter.lte = parsed;
    }
  }
  if (Object.keys(dateFilter).length > 0) {
    filters.createdAt = dateFilter;
  }

  return filters;
}

export const DATE_RANGE_PRESETS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7_days", label: "Last 7 days" },
  { key: "last_30_days", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
  { key: "last_year", label: "Last year" },
];
