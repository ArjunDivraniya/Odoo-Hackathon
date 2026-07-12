import { NotificationStatus, PriorityLevel } from "@prisma/client";

export interface NotificationFilter {
  status?: NotificationStatus;
  type?: string;
  priority?: PriorityLevel;
  unreadOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: PriorityLevel;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: any;
  expiresInDays?: number;
}

export interface NotificationPreferenceInput {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  inAppEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  mutedTypes?: any;
}
