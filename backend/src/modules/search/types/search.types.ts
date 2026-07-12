export type SearchEntityType =
  | "asset"
  | "employee"
  | "department"
  | "maintenance"
  | "audit"
  | "notification"
  | "report"
  | "file";

export interface SearchResultItem {
  type: SearchEntityType;
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
}

export interface SuggestResultItem {
  type: SearchEntityType;
  id: string;
  label: string;
}

export type GlobalSearchResults = Record<SearchEntityType, SearchResultItem[]>;

export interface GlobalFilterDimensions {
  statuses: {
    asset: string[];
    maintenance: string[];
    audit: string[];
    notification: string[];
  };
  priorities: string[];
  departments: { id: string; name: string }[];
  users: { id: string; name: string }[];
  technicians: { id: string; name: string }[];
  auditCycles: { id: string; name: string }[];
  notificationTypes: string[];
  dateRangePresets: { key: string; label: string }[];
}

export interface CommonFilterParams {
  status?: string;
  priority?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  technicianId?: string;
  auditCycleId?: string;
}
