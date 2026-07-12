import apiClient from "@/lib/api-client";
import { Allocation, AllocationPaginatedResponse } from "@/types/allocation";

export const allocationService = {
  getAllocations: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string;
    department?: string;
    employee?: string;
  }): Promise<AllocationPaginatedResponse> => {
    const response = await apiClient.get(`/allocations`, {
      params,
    });
    return response.data;
  },

  getAllocation: async (id: string): Promise<Allocation> => {
    const response = await apiClient.get(`/allocations/${id}`);
    return response.data;
  },

  getOverdueAllocations: async (params?: { page?: number; limit?: number }): Promise<AllocationPaginatedResponse> => {
    const response = await apiClient.get(`/allocations/overdue`, {
      params,
    });
    return response.data;
  },

  createAllocation: async (data: Partial<Allocation>): Promise<Allocation> => {
    const response = await apiClient.post(`/allocations`, data);
    return response.data;
  },

  updateAllocation: async (id: string, data: Partial<Allocation>): Promise<Allocation> => {
    const response = await apiClient.patch(`/allocations/${id}`, data);
    return response.data;
  },
};
