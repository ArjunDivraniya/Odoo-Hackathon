import { z } from "zod";

export const createAssetCategorySchema = z.object({
  companyId: z.string().uuid("Invalid Company ID"),
  parentId: z.string().uuid("Invalid Parent Category ID").optional().nullable(),
  name: z.string().min(1, "Category name is required").max(200),
  code: z.string().min(1, "Category code is required").max(20),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(7).optional(),
  depreciationMethod: z.string().max(50).optional(),
  usefulLifeMonths: z.number().int().positive().optional(),
  salvageValuePercent: z.number().min(0).max(100).optional(),
  requiresMaintenance: z.boolean().optional(),
  requiresCalibration: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateAssetCategorySchema = createAssetCategorySchema.partial().omit({ companyId: true });

export const createCustomFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").max(100),
  label: z.string().min(1, "Field label is required").max(200),
  fieldType: z.string().min(1, "Field type is required").max(30),
  isRequired: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z.any().optional(),
  validation: z.any().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCustomFieldSchema = createCustomFieldSchema.partial();
