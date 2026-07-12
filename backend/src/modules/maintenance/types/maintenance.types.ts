import { MaintenanceStatus, PriorityLevel } from "@prisma/client";

export interface MaintenanceListFilters {
  status?: MaintenanceStatus;
  priority?: PriorityLevel;
  assetId?: string;
  requestedBy?: string;
  technicianId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MaintenanceSearchFilters extends MaintenanceListFilters {
  q?: string;
}

export interface TimelineEntry {
  id: string;
  eventType: "STATUS_CHANGE" | "TECHNICIAN_ASSIGNED" | "ATTACHMENT_ADDED";
  timestamp: Date;
  title: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
