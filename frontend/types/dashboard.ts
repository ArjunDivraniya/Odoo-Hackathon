export interface DashboardSummary {
  totalAssets: number;
  totalAssetsTrend: number; // percentage change
  availableAssets: number;
  availableAssetsTrend: number;
  allocatedAssets: number;
  allocatedAssetsTrend: number;
  maintenanceToday: number;
  pendingTransfers: number;
  upcomingReturns: number;
  pendingAudits: number;
  activeBookings: number;
}

export interface DashboardActivity {
  id: string;
  type: "ALLOCATION" | "RETURN" | "MAINTENANCE" | "AUDIT" | "TRANSFER" | "REGISTRATION";
  description: string;
  userId: string;
  userName: string;
  assetId: string;
  assetName: string;
  timestamp: string;
  status?: "PENDING" | "COMPLETED" | "IN_PROGRESS" | "FAILED";
}

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  type: "MAINTENANCE" | "RETURN" | "AUDIT" | "TRANSFER" | "APPROVAL";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate: string;
  assignedTo?: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: "ALERT" | "WARNING" | "INFO" | "SUCCESS";
  timestamp: string;
  read: boolean;
}

export interface AssetStatusData {
  name: string;
  value: number;
  color: string;
}

export interface DepartmentUtilizationData {
  department: string;
  utilized: number;
  total: number;
}

export interface TrendData {
  date: string;
  value: number;
  secondaryValue?: number;
}

export interface AuditProgressData {
  name: string;
  value: number;
  color: string;
}

export interface AssetUsageData {
  assetName: string;
  usageCount: number;
}
