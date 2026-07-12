import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const createWidgetSchema = z.object({
  widgetType: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  config: z.any(),
  positionX: z.number().int().min(0).optional(),
  positionY: z.number().int().min(0).optional(),
  width: z.number().int().positive().max(12).optional(),
  height: z.number().int().positive().max(12).optional(),
  refreshIntervalSeconds: z.number().int().positive().optional(),
  isVisible: z.boolean().optional(),
});

export const updateWidgetSchema = z.object({
  widgetType: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(100).optional(),
  config: z.any().optional(),
  positionX: z.number().int().min(0).optional(),
  positionY: z.number().int().min(0).optional(),
  width: z.number().int().positive().max(12).optional(),
  height: z.number().int().positive().max(12).optional(),
  refreshIntervalSeconds: z.number().int().positive().optional(),
  isVisible: z.boolean().optional(),
});
