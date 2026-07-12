import { AuditStatus, AssetCondition, PriorityLevel } from "@prisma/client";

export interface CreateAuditCycleInput {
  name: string;
  description?: string;
  frequency: string;
  frequencyConfig?: any;
  scope?: any;
  startDate: Date;
  endDate?: Date;
  nextAuditDate?: Date;
  autoAssign?: boolean;
  metadata?: any;
}

export interface UpdateAuditCycleInput {
  name?: string;
  description?: string;
  frequency?: string;
  frequencyConfig?: any;
  scope?: any;
  startDate?: Date;
  endDate?: Date;
  nextAuditDate?: Date;
  isActive?: boolean;
  autoAssign?: boolean;
  metadata?: any;
}

export interface AssignAuditorInput {
  auditorId: string;
  officeId?: string;
  departmentId?: string;
  scheduledDate: Date;
  assetCount?: number;
  notes?: string;
}

export interface SubmitResultInput {
  assetId: string;
  status: string;
  condition?: AssetCondition;
  locationMatch?: boolean;
  expectedLocation?: string;
  actualLocation?: string;
  notes?: string;
  photos?: any;
  assignedTo?: string;
}

export interface AuditCycleFilters {
  isActive?: boolean;
  status?: AuditStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface DashboardData {
  totalAssetsAudited: number;
  verifiedCount: number;
  missingCount: number;
  damagedCount: number;
  discrepancyCount: number;
  assignmentProgress: Array<{
    assignmentId: string;
    auditorId: string;
    status: AuditStatus;
    assetCount: number | null;
    auditedCount: number;
    discrepancyCount: number;
  }>;
}
