import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationService } from "@/services/allocation.service";
import { Allocation, AllocationPaginatedResponse } from "@/types/allocation";
import { toast } from "sonner";

export const ALLOCATIONS_QUERY_KEY = ["allocations"];
export const OVERDUE_ALLOCATIONS_QUERY_KEY = ["allocations", "overdue"];

export function useAllocations(params?: { 
  page?: number; 
  limit?: number; 
  search?: string;
  status?: string;
  department?: string;
  employee?: string;
}) {
  return useQuery<AllocationPaginatedResponse, Error>({
    queryKey: [...ALLOCATIONS_QUERY_KEY, params],
    queryFn: () => allocationService.getAllocations(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOverdueAllocations(params?: { page?: number; limit?: number }) {
  return useQuery<AllocationPaginatedResponse, Error>({
    queryKey: [...OVERDUE_ALLOCATIONS_QUERY_KEY, params],
    queryFn: () => allocationService.getOverdueAllocations(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllocation(id: string) {
  return useQuery<Allocation, Error>({
    queryKey: [...ALLOCATIONS_QUERY_KEY, id],
    queryFn: () => allocationService.getAllocation(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Allocation>) => allocationService.createAllocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_QUERY_KEY });
      toast.success("Asset allocated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to allocate asset");
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Allocation> }) => 
      allocationService.updateAllocation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...ALLOCATIONS_QUERY_KEY, variables.id] });
      toast.success("Allocation updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update allocation");
    },
  });
}
