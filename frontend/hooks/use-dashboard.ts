import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/services/dashboard.service";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: DashboardService.getSummary,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: DashboardService.getRecentActivity,
  });
}

export function usePendingTasks() {
  return useQuery({
    queryKey: ["dashboard", "tasks"],
    queryFn: DashboardService.getPendingTasks,
  });
}

export function useDashboardNotifications() {
  return useQuery({
    queryKey: ["dashboard", "notifications"],
    queryFn: DashboardService.getNotificationsPreview,
  });
}

export function useAssetStatus() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "assetStatus"],
    queryFn: DashboardService.getAssetStatus,
  });
}

export function useDepartmentUtilization() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "departmentUtilization"],
    queryFn: DashboardService.getDepartmentUtilization,
  });
}

export function useMaintenanceTrend() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "maintenanceTrend"],
    queryFn: DashboardService.getMaintenanceTrend,
  });
}

export function useBookingTrend() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "bookingTrend"],
    queryFn: DashboardService.getBookingTrend,
  });
}

export function useAuditProgress() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "auditProgress"],
    queryFn: DashboardService.getAuditProgress,
  });
}

export function useMostUsedAssets() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "mostUsedAssets"],
    queryFn: DashboardService.getMostUsedAssets,
  });
}

export function useIdleAssets() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "idleAssets"],
    queryFn: DashboardService.getIdleAssets,
  });
}

export function useMonthlyGrowth() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "monthlyGrowth"],
    queryFn: DashboardService.getMonthlyGrowth,
  });
}

export function useYearlyGrowth() {
  return useQuery({
    queryKey: ["dashboard", "analytics", "yearlyGrowth"],
    queryFn: DashboardService.getYearlyGrowth,
  });
}
