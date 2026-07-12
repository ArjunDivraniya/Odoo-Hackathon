import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/services/department.service";
import { Department, PaginatedResponse } from "@/types/organization";
import { toast } from "sonner";

export const DEPARTMENTS_QUERY_KEY = ["departments"];

export function useDepartments(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery<PaginatedResponse<Department>, Error>({
    queryKey: [...DEPARTMENTS_QUERY_KEY, params],
    queryFn: () => departmentService.getDepartments(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Department>) => departmentService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
      toast.success("Department created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create department");
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) => 
      departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
      toast.success("Department updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update department");
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
      toast.success("Department deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete department");
    },
  });
}
