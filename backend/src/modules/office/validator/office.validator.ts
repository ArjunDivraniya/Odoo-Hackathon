import { z } from "zod";

export const createOfficeSchema = z.object({
  companyId: z.string().uuid("Invalid Company ID"),
  name: z.string().min(1, "Office name is required").max(200),
  code: z.string().min(1, "Office code is required").max(20),
  description: z.string().max(1000).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Invalid email").max(255).optional(),
  timezone: z.string().max(50).optional(),
  isHq: z.boolean().optional(),
  isActive: z.boolean().optional(),
  maxCapacity: z.number().int().positive().optional(),
});

export const updateOfficeSchema = createOfficeSchema.partial().omit({ companyId: true });
