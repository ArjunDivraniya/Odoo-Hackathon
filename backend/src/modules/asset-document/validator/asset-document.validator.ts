import { z } from "zod";

export const createAssetDocumentSchema = z.object({
  assetId: z.string().uuid(),
  documentType: z.string().min(1, "Document type is required").max(50),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  expiryDate: z.string().optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateAssetDocumentSchema = createAssetDocumentSchema.partial().omit({ assetId: true });
