import { ReportDataSource } from "../types/reports.types";

export const REPORT_ACTIONS = {
  METADATA_CREATED: "REPORT_METADATA_CREATED",
  METADATA_UPDATED: "REPORT_METADATA_UPDATED",
  GENERATED: "REPORT_GENERATED",
} as const;

export const REPORT_NOTIFICATION_TYPE = "REPORT_READY";

export const ASSET_REPORT_COLUMNS = [
  { key: "assetTag", header: "Asset Tag" },
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
  { key: "condition", header: "Condition" },
  { key: "categoryName", header: "Category" },
  { key: "departmentName", header: "Department" },
  { key: "officeName", header: "Office" },
  { key: "purchaseDate", header: "Purchase Date" },
  { key: "currentValue", header: "Current Value" },
];

export const MAINTENANCE_REPORT_COLUMNS = [
  { key: "reference", header: "Reference" },
  { key: "title", header: "Title" },
  { key: "assetTag", header: "Asset Tag" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "type", header: "Type" },
  { key: "requestedAt", header: "Requested At" },
  { key: "completedAt", header: "Completed At" },
  { key: "estimatedCost", header: "Estimated Cost" },
  { key: "actualCost", header: "Actual Cost" },
];

export const AUDIT_REPORT_COLUMNS = [
  { key: "cycleName", header: "Audit Cycle" },
  { key: "assignmentAuditor", header: "Auditor" },
  { key: "status", header: "Status" },
  { key: "assetCount", header: "Asset Count" },
  { key: "auditedCount", header: "Audited Count" },
  { key: "discrepancyCount", header: "Discrepancies" },
  { key: "completedAt", header: "Completed At" },
];

export const DEPARTMENT_REPORT_COLUMNS = [
  { key: "departmentName", header: "Department" },
  { key: "totalAssets", header: "Total Assets" },
  { key: "allocatedAssets", header: "Allocated Assets" },
  { key: "availableAssets", header: "Available Assets" },
  { key: "maintenanceRequests", header: "Maintenance Requests" },
  { key: "utilization", header: "Utilization %" },
];

export const EMPLOYEE_REPORT_COLUMNS = [
  { key: "employeeName", header: "Employee" },
  { key: "employeeId", header: "Employee ID" },
  { key: "departmentName", header: "Department" },
  { key: "status", header: "Status" },
  { key: "allocatedAssets", header: "Allocated Assets" },
  { key: "activeAllocations", header: "Active Allocations" },
];

export const ALLOCATION_REPORT_COLUMNS = [
  { key: "assetTag", header: "Asset Tag" },
  { key: "assetName", header: "Asset" },
  { key: "employeeName", header: "Employee" },
  { key: "status", header: "Status" },
  { key: "allocationDate", header: "Allocated At" },
  { key: "expectedReturnDate", header: "Expected Return" },
  { key: "isOverdue", header: "Overdue" },
];

export const UTILIZATION_REPORT_COLUMNS = [
  { key: "group", header: "Group" },
  { key: "total", header: "Total Assets" },
  { key: "inUse", header: "In Use" },
  { key: "available", header: "Available" },
  { key: "utilization", header: "Utilization %" },
];

export const BOOKING_REPORT_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "resourceName", header: "Resource" },
  { key: "bookedBy", header: "Booked By" },
  { key: "status", header: "Status" },
  { key: "startTime", header: "Start" },
  { key: "endTime", header: "End" },
  { key: "attendeeCount", header: "Attendees" },
];

export const REPORT_COLUMNS_BY_SOURCE: Record<ReportDataSource, { key: string; header: string }[]> = {
  asset: ASSET_REPORT_COLUMNS,
  maintenance: MAINTENANCE_REPORT_COLUMNS,
  audit: AUDIT_REPORT_COLUMNS,
  department: DEPARTMENT_REPORT_COLUMNS,
  employee: EMPLOYEE_REPORT_COLUMNS,
  allocation: ALLOCATION_REPORT_COLUMNS,
  utilization: UTILIZATION_REPORT_COLUMNS,
  booking: BOOKING_REPORT_COLUMNS,
};
