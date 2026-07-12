export interface ListLookupFilters {
  category?: string;
  isActive?: boolean;
}

export interface CreateLookupInput {
  companyId?: string | null;
  category: string;
  code: string;
  label: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: any;
}

export interface UpdateLookupInput {
  label?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: any;
}

export interface ListMasterStatusFilters {
  entityType?: string;
  isActive?: boolean;
}

export interface CreateMasterStatusInput {
  companyId?: string | null;
  entityType: string;
  statusCode: string;
  label: string;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  transitions?: any;
}

export interface UpdateMasterStatusInput {
  label?: string;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  transitions?: any;
}
