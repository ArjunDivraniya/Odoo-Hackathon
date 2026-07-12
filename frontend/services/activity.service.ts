import apiClient from "@/lib/api-client";
import { 
  ApprovalTask, 
  UpcomingReturn, 
  OverdueAsset, 
  MaintenanceRequestTask, 
  TransferRequestTask 
} from "@/types/activity";

export const ActivityService = {
  getPendingApprovals: async (): Promise<ApprovalTask[]> => {
    const response = await apiClient.get("/dashboard/activity/approvals");
    return response.data.data;
  },

  getUpcomingReturns: async (): Promise<UpcomingReturn[]> => {
    const response = await apiClient.get("/dashboard/activity/returns");
    return response.data.data;
  },

  getOverdueAssets: async (): Promise<OverdueAsset[]> => {
    const response = await apiClient.get("/dashboard/activity/overdue");
    return response.data.data;
  },

  getMaintenanceRequests: async (): Promise<MaintenanceRequestTask[]> => {
    const response = await apiClient.get("/dashboard/activity/maintenance");
    return response.data.data;
  },

  getTransferRequests: async (): Promise<TransferRequestTask[]> => {
    const response = await apiClient.get("/dashboard/activity/transfers");
    return response.data.data;
  }
};
