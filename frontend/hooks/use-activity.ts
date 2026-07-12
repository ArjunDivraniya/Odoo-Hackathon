import { useQuery } from "@tanstack/react-query";
import { ActivityService } from "@/services/activity.service";

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["dashboard", "activity", "approvals"],
    queryFn: ActivityService.getPendingApprovals,
  });
}

export function useUpcomingReturns() {
  return useQuery({
    queryKey: ["dashboard", "activity", "returns"],
    queryFn: ActivityService.getUpcomingReturns,
  });
}

export function useOverdueAssets() {
  return useQuery({
    queryKey: ["dashboard", "activity", "overdue"],
    queryFn: ActivityService.getOverdueAssets,
  });
}

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: ["dashboard", "activity", "maintenance"],
    queryFn: ActivityService.getMaintenanceRequests,
  });
}

export function useTransferRequests() {
  return useQuery({
    queryKey: ["dashboard", "activity", "transfers"],
    queryFn: ActivityService.getTransferRequests,
  });
}
