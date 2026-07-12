import { z } from "zod";

export const generateQrSchema = z.object({
  assetId: z.string().uuid(),
  format: z.string().max(20).optional(),
});

export const scanQrSchema = z.object({
  code: z.string().min(1),
});
