import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  types: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const suggestQuerySchema = z.object({
  q: z.string().trim().optional(),
  types: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const logSearchSchema = z.object({
  q: z.string().trim().optional(),
  types: z.string().trim().optional(),
});
