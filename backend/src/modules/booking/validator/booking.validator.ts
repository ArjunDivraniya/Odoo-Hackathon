import { z } from "zod";

export const createBookingSchema = z.object({
  resourceId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  attendeeCount: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().max(255).optional().nullable(),
  recurrenceEnd: z.string().optional().nullable(),
  participantUserIds: z.array(z.string().uuid()).optional(),
});

export const updateBookingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().max(2000).optional(),
});
