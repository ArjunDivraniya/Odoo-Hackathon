import {
  AssetStatus,
  AllocationStatus,
  MaintenanceStatus,
  AuditStatus,
  BookingStatus,
  PriorityLevel,
} from "@prisma/client";

export interface ReportFilter {
  status?: string;
  categoryId?: string;
  departmentId?: string;
  officeId?: string;
  condition?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportRow {
  [key: string]: any;
}

export interface ReportResult {
  rows: ReportRow[];
  summary?: any;
  columns: { key: string; header: string }[];
}

export type ReportDataSource =
  | "asset"
  | "maintenance"
  | "audit"
  | "department"
  | "employee"
  | "allocation"
  | "utilization"
  | "booking";

export interface ReportDefinitionInput {
  name: string;
  description?: string;
  category: string;
  reportType: string;
  dataSource?: string;
  filters?: any;
  columns?: any;
  groupBy?: any;
  sortBy?: any;
  chartConfig?: any;
  isPublic?: boolean;
  isScheduled?: boolean;
  scheduleConfig?: any;
}

export const REPORT_DATA_SOURCES: ReportDataSource[] = [
  "asset",
  "maintenance",
  "audit",
  "department",
  "employee",
  "allocation",
  "utilization",
  "booking",
];

export {
  AssetStatus,
  AllocationStatus,
  MaintenanceStatus,
  AuditStatus,
  BookingStatus,
  PriorityLevel,
};
