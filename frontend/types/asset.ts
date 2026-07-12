import { Category, Department, Employee, PaginatedResponse } from "./organization";

export type AssetStatus = "AVAILABLE" | "ALLOCATED" | "RESERVED" | "MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";
export type AssetCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";

export interface Asset {
  id: string;
  name: string;
  tag: string;
  serialNumber?: string;
  manufacturer?: string;
  modelNumber?: string;
  vendor?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  condition: AssetCondition;
  status: AssetStatus;
  description?: string;
  isShared: boolean;
  
  categoryId: string;
  category?: Category;
  
  departmentId: string;
  department?: Department;
  
  assignedUserId?: string;
  assignedUser?: Employee;
  
  office?: string;
  location?: string;
  
  images: AssetImage[];
  documents: AssetDocument[];
  
  createdAt: string;
  updatedAt: string;
}

export interface AssetImage {
  id: string;
  assetId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface AssetDocument {
  id: string;
  assetId: string;
  name: string;
  url: string;
  type: "INVOICE" | "WARRANTY" | "MANUAL" | "OTHER";
  createdAt: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  action: "CREATED" | "UPDATED" | "ALLOCATED" | "TRANSFERRED" | "RETURNED" | "MAINTENANCE" | "STATUS_CHANGE";
  description: string;
  performedById?: string;
  performedBy?: Employee;
  createdAt: string;
}

export type AssetPaginatedResponse = PaginatedResponse<Asset>;
