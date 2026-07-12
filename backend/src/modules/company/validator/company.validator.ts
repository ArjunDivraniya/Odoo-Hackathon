import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  legalName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  email: z.string().email("Invalid email").max(255).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().max(255).optional(),
  logoUrl: z.string().max(500).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(3).optional(),
  fiscalYearStart: z.number().int().min(1).max(12).optional(),
  isActive: z.boolean().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();
