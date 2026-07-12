import { z } from "zod";

export const createAssetImageSchema = z.object({
  assetId: z.string().uuid(),
  imageType: z.string().max(50).optional(),
  caption: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  takenAt: z.string().optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
});

export const updateAssetImageSchema = createAssetImageSchema.partial().omit({ assetId: true });
