import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(500),
  bodyHtml: z.string().min(1, "Body HTML is required"),
  bodyText: z.string().optional().nullable(),
  variables: z.any().optional(),
  category: z.string().min(1, "Category is required").max(100),
  isActive: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  bodyHtml: z.string().min(1).optional(),
  bodyText: z.string().optional().nullable(),
  variables: z.any().optional(),
  category: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const previewTemplateSchema = z.object({
  data: z.record(z.string(), z.any()).optional(),
});

export const sendEmailSchema = z.object({
  to: z.string().email("A valid recipient email is required"),
  templateName: z.string().min(1, "Template name is required"),
  data: z.record(z.string(), z.any()).optional(),
});
