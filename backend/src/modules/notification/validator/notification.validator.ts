import { z } from "zod";
import { NotificationStatus, PriorityLevel } from "@prisma/client";

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required"),
  type: z.string().min(1).max(50),
  priority: z.nativeEnum(PriorityLevel).optional(),
  entityType: z.string().max(50).optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  actionUrl: z.string().max(500).optional().nullable(),
  metadata: z.any().optional().nullable(),
  expiresInDays: z.number().int().positive().optional(),
});

export const sendInAppSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required"),
  type: z.string().min(1).max(50),
  priority: z.nativeEnum(PriorityLevel).optional(),
  entityType: z.string().max(50).optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  actionUrl: z.string().max(500).optional().nullable(),
  metadata: z.any().optional().nullable(),
  expiresInDays: z.number().int().positive().optional(),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
  type: z.string().optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  unreadOnly: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const updatePreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  quietHoursStart: z.string().max(5).optional().nullable(),
  quietHoursEnd: z.string().max(5).optional().nullable(),
  mutedTypes: z.array(z.string()).optional().nullable(),
});
