import { z } from "zod";

export const listFilesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  mimeType: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "originalName", "fileSize", "accessCount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const signedUrlQuerySchema = z.object({
  expiresIn: z.coerce.number().int().positive().max(86400).optional(),
});
