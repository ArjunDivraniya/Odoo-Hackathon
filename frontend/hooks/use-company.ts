import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { Company } from "@/types/organization";
import { toast } from "sonner";

export const COMPANY_QUERY_KEY = ["company"];

export function useCompany() {
  return useQuery<Company, Error>({
    queryKey: COMPANY_QUERY_KEY,
    queryFn: companyService.getCompany,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Company>) => companyService.updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY });
      toast.success("Company information updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update company information");
    },
  });
}

export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => companyService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY });
      toast.success("Company logo uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload logo");
    },
  });
}
