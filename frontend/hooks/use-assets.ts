import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetService } from "@/services/asset.service";
import { Asset, AssetPaginatedResponse } from "@/types/asset";
import { toast } from "sonner";

export const ASSETS_QUERY_KEY = ["assets"];

export function useAssets(params?: { 
  page?: number; 
  limit?: number; 
  search?: string;
  status?: string;
  category?: string;
  department?: string;
}) {
  return useQuery<AssetPaginatedResponse, Error>({
    queryKey: [...ASSETS_QUERY_KEY, params],
    queryFn: () => assetService.getAssets(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAsset(id: string) {
  return useQuery<Asset, Error>({
    queryKey: [...ASSETS_QUERY_KEY, id],
    queryFn: () => assetService.getAsset(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Asset>) => assetService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
      toast.success("Asset registered successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register asset");
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) => 
      assetService.updateAsset(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...ASSETS_QUERY_KEY, variables.id] });
      toast.success("Asset updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update asset");
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
      toast.success("Asset deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete asset");
    },
  });
}
