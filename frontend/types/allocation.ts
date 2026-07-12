import { Asset, AssetCondition } from "./asset";
import { Department, Employee, PaginatedResponse } from "./organization";

export type AllocationStatus = "ACTIVE" | "RETURNED" | "OVERDUE" | "TRANSFERRING" | "CANCELLED";

export interface Allocation {
  id: string;
  assetId: string;
  asset?: Asset;
  
  employeeId: string;
  employee?: Employee;
  
  departmentId: string;
  department?: Department;
  
  allocatedDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  
  purpose?: string;
  notes?: string;
  status: AllocationStatus;
  
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";

export interface TransferRequest {
  id: string;
  assetId: string;
  asset?: Asset;
  
  currentHolderId: string;
  currentHolder?: Employee;
  
  requestedHolderId: string;
  requestedHolder?: Employee;
  
  currentDepartmentId: string;
  requestedDepartmentId: string;
  
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: TransferStatus;
  
  approvedById?: string;
  approvedBy?: Employee;
  approvedDate?: string;
  
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReturnRequest {
  id: string;
  allocationId: string;
  allocation?: Allocation;
  
  assetId: string;
  asset?: Asset;
  
  employeeId: string;
  employee?: Employee;
  
  returnDate: string;
  condition: AssetCondition;
  damageNotes?: string;
  remarks?: string;
  status: ReturnStatus;
  
  createdAt: string;
  updatedAt: string;
}

export type AllocationPaginatedResponse = PaginatedResponse<Allocation>;
export type TransferPaginatedResponse = PaginatedResponse<TransferRequest>;
export type ReturnPaginatedResponse = PaginatedResponse<ReturnRequest>;
