import { z } from "zod";
import { SETTING_TYPES, SETTING_CATEGORIES, HOLIDAY_TYPES } from "../constants/system.constants";

export const upsertSettingSchema = z.object({
  value: z.any(),
  type: z.enum(SETTING_TYPES).optional(),
  category: z.enum(SETTING_CATEGORIES).optional(),
  description: z.string().max(2000).optional().nullable(),
  isPublic: z.boolean().optional(),
  validation: z.any().optional(),
  global: z.boolean().optional(),
});

export const applicationConfigSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1).max(200),
        value: z.any(),
        type: z.enum(SETTING_TYPES).optional(),
        description: z.string().max(2000).optional().nullable(),
        isPublic: z.boolean().optional(),
      })
    )
    .min(1, "At least one setting is required"),
});

const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

export const workingHoursSchema = z.object({
  workingHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: timeString,
        endTime: timeString,
        breakStart: timeString.optional().nullable(),
        breakEnd: timeString.optional().nullable(),
        isWorkingDay: z.boolean().optional(),
        effectiveFrom: z.string().optional(),
        effectiveUntil: z.string().optional().nullable(),
      })
    )
    .min(1, "At least one working hour entry is required"),
});

export const createHolidaySchema = z.object({
  officeId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Name is required").max(200),
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional().nullable(),
  type: z.enum(HOLIDAY_TYPES).optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateHolidaySchema = z.object({
  officeId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200).optional(),
  date: z.string().optional(),
  endDate: z.string().optional().nullable(),
  type: z.enum(HOLIDAY_TYPES).optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
