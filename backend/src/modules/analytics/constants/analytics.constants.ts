import { z } from "zod";

export const analyticsCacheTtl = 300;

export const ASSET_UTILIZATION_COLUMNS = [
  { key: "group", header: "Group" },
  { key: "total", header: "Total Assets" },
  { key: "inUse", header: "In Use" },
  { key: "available", header: "Available" },
  { key: "utilization", header: "Utilization %" },
];

export const MOST_USED_ASSETS_COLUMNS = [
  { key: "assetTag", header: "Asset Tag" },
  { key: "name", header: "Asset" },
  { key: "categoryName", header: "Category" },
  { key: "allocationCount", header: "Allocations" },
  { key: "bookingCount", header: "Bookings" },
  { key: "usageScore", header: "Usage Score" },
];

export const IDLE_ASSETS_COLUMNS = [
  { key: "assetTag", header: "Asset Tag" },
  { key: "name", header: "Asset" },
  { key: "categoryName", header: "Category" },
  { key: "departmentName", header: "Department" },
  { key: "lastAllocationDate", header: "Last Allocation" },
  { key: "idleDays", header: "Idle Days" },
];

export const MAINTENANCE_TRENDS_COLUMNS = [
  { key: "month", header: "Month" },
  { key: "total", header: "Total" },
  { key: "requested", header: "Requested" },
  { key: "inProgress", header: "In Progress" },
  { key: "completed", header: "Completed" },
];

export const DEPARTMENT_ANALYTICS_COLUMNS = [
  { key: "departmentName", header: "Department" },
  { key: "totalAssets", header: "Total Assets" },
  { key: "allocatedAssets", header: "Allocated" },
  { key: "availableAssets", header: "Available" },
  { key: "maintenanceRequests", header: "Maintenance Requests" },
  { key: "utilization", header: "Utilization %" },
];

export const MONTHLY_REPORT_COLUMNS = [
  { key: "month", header: "Month" },
  { key: "assetsAdded", header: "Assets Added" },
  { key: "maintenanceRequests", header: "Maintenance Requests" },
  { key: "audits", header: "Audits" },
  { key: "bookings", header: "Bookings" },
];

export const YEARLY_REPORT_COLUMNS = [
  { key: "year", header: "Year" },
  { key: "assetsAdded", header: "Assets Added" },
  { key: "maintenanceRequests", header: "Maintenance Requests" },
  { key: "audits", header: "Audits" },
  { key: "bookings", header: "Bookings" },
];
