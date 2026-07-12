export interface ActivityLogFilter {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  status?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateActivityLogInput {
  companyId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
  requestId?: string;
  durationMs?: number;
  status?: string;
  errorMessage?: string;
  metadata?: any;
}
