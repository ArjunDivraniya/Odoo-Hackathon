import apiClient from "@/lib/api-client";
import { Asset, AssetPaginatedResponse } from "@/types/asset";

export const assetService = {
  getAssets: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string;
    category?: string;
    department?: string;
  }): Promise<AssetPaginatedResponse> => {
    const response = await apiClient.get(`/assets`, {
      params,
    });
    return response.data;
  },

  getAsset: async (id: string): Promise<Asset> => {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },

  createAsset: async (data: Partial<Asset>): Promise<Asset> => {
    const response = await apiClient.post(`/assets`, data);
    return response.data;
  },

  updateAsset: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    const response = await apiClient.patch(`/assets/${id}`, data);
    return response.data;
  },

  deleteAsset: async (id: string): Promise<void> => {
    await apiClient.delete(`/assets/${id}`);
  },
};
