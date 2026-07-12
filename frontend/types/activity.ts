export interface ApprovalTask {
  id: string;
  title: string;
  description: string;
  requester: string;
  date: string;
}

export interface UpcomingReturn {
  id: string;
  assetName: string;
  assigneeName: string;
  returnDate: string;
}

export interface OverdueAsset {
  id: string;
  assetName: string;
  assigneeName: string;
  returnDate: string;
}

export interface MaintenanceRequestTask {
  id: string;
  assetName: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
  date: string;
}

export interface TransferRequestTask {
  id: string;
  assetName: string;
  from: string;
  to: string;
  date: string;
}
