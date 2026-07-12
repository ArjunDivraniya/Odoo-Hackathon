import apiClient from "@/lib/api-client";
import { Company } from "@/types/organization";

export const companyService = {
  getCompany: async (): Promise<Company> => {
    const response = await apiClient.get(`/company`);
    return response.data;
  },

  updateCompany: async (data: Partial<Company>): Promise<Company> => {
    const response = await apiClient.patch(`/company`, data);
    return response.data;
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append("logo", file);
    
    const response = await apiClient.post(`/company/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
