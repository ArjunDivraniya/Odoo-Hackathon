import { z } from "zod";

export const createLookupSchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  category: z.string().min(1, "Category is required").max(50),
  code: z.string().min(1, "Code is required").max(50),
  label: z.string().min(1, "Label is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
});

export const updateLookupSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
});

export const createMasterStatusSchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  entityType: z.string().min(1, "Entity type is required").max(50),
  statusCode: z.string().min(1, "Status code is required").max(50),
  label: z.string().min(1, "Label is required").max(100),
  color: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  transitions: z.any().optional(),
});

export const updateMasterStatusSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  color: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  transitions: z.any().optional(),
});
