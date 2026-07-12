import { z } from "zod";

export const createAssetSchema = z.object({
  companyId: z.string().uuid(),
  categoryId: z.string().uuid(),
  officeId: z.string().uuid(),
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  custodianId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Asset name is required").max(200),
  description: z.string().max(2000).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  currentValue: z.number().min(0).optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  expectedLifeYears: z.number().int().positive().optional().nullable(),
  manufacturer: z.string().max(200).optional(),
  model: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  rfidTag: z.string().max(100).optional(),
  imageUrl: z.string().max(500).optional(),
  customAttributes: z.any().optional(),
  specifications: z.any().optional(),
  isActive: z.boolean().optional(),
});

export const updateAssetSchema = createAssetSchema.partial().omit({ companyId: true });
