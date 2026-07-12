import apiClient from "@/lib/api-client";
import { DashboardSummary, DashboardActivity, DashboardTask, DashboardNotification, AssetStatusData, DepartmentUtilizationData, TrendData, AuditProgressData, AssetUsageData } from "@/types/dashboard";

export const DashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get("/dashboard/summary");
    return response.data.data;
  },

  getRecentActivity: async (): Promise<DashboardActivity[]> => {
    const response = await apiClient.get("/dashboard/activity");
    return response.data.data;
  },

  getPendingTasks: async (): Promise<DashboardTask[]> => {
    const response = await apiClient.get("/dashboard/tasks");
    return response.data.data;
  },

  getNotificationsPreview: async (): Promise<DashboardNotification[]> => {
    const response = await apiClient.get("/dashboard/notifications");
    return response.data.data;
  },

  getAssetStatus: async (): Promise<AssetStatusData[]> => {
    const response = await apiClient.get("/dashboard/analytics/asset-status");
    return response.data.data;
  },

  getDepartmentUtilization: async (): Promise<DepartmentUtilizationData[]> => {
    const response = await apiClient.get("/dashboard/analytics/department-utilization");
    return response.data.data;
  },

  getMaintenanceTrend: async (): Promise<TrendData[]> => {
    const response = await apiClient.get("/dashboard/analytics/maintenance-trend");
    return response.data.data;
  },

  getBookingTrend: async (): Promise<TrendData[]> => {
    const response = await apiClient.get("/dashboard/analytics/booking-trend");
    return response.data.data;
  },

  getAuditProgress: async (): Promise<AuditProgressData[]> => {
    const response = await apiClient.get("/dashboard/analytics/audit-progress");
    return response.data.data;
  },

  getMostUsedAssets: async (): Promise<AssetUsageData[]> => {
    const response = await apiClient.get("/dashboard/analytics/most-used-assets");
    return response.data.data;
  },

  getIdleAssets: async (): Promise<AssetUsageData[]> => {
    const response = await apiClient.get("/dashboard/analytics/idle-assets");
    return response.data.data;
  },

  getMonthlyGrowth: async (): Promise<TrendData[]> => {
    const response = await apiClient.get("/dashboard/analytics/monthly-growth");
    return response.data.data;
  },

  getYearlyGrowth: async (): Promise<TrendData[]> => {
    const response = await apiClient.get("/dashboard/analytics/yearly-growth");
    return response.data.data;
  },
};
