export interface DashboardSummary {
  totalAssets: number;
  availableAssets: number;
  underMaintenance: number;
  totalMaintenanceOpen: number;
  totalAuditsActive: number;
  totalBookingsToday: number;
  totalEmployees: number;
  totalDepartments: number;
}

export interface KpiDelta {
  current: number;
  previous: number;
  delta: number;
}

export interface KpiCard {
  key: string;
  label: string;
  value: number;
  delta?: KpiDelta;
}

export interface OverviewByStatus {
  status: string;
  count: number;
}

export interface OverviewByName {
  id: string;
  name: string;
  count: number;
}

export interface TrendPoint {
  month: string;
  label: string;
  requested: number;
  completed: number;
}

export interface TaskItem {
  id: string;
  type: "MAINTENANCE" | "AUDIT";
  title: string;
  scheduledDate: Date | null;
  status: string;
}

export interface OverdueItem {
  id: string;
  type: "MAINTENANCE" | "AUDIT" | "BOOKING";
  title: string;
  scheduledDate: Date | null;
  status: string;
}
