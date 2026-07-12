import apiClient from "@/lib/api-client";
import { Department, PaginatedResponse } from "@/types/organization";

export const departmentService = {
  getDepartments: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Department>> => {
    const response = await apiClient.get(`/departments`, {
      params,
    });
    return response.data;
  },

  getDepartment: async (id: string): Promise<Department> => {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  createDepartment: async (data: Partial<Department>): Promise<Department> => {
    const response = await apiClient.post(`/departments`, data);
    return response.data;
  },

  updateDepartment: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await apiClient.patch(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },
};
