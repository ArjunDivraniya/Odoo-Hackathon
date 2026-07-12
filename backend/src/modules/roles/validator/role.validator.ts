import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().max(500).optional(),
  companyId: z.string().uuid("Invalid Company ID").optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const assignPermissionSchema = z.object({
  permissionId: z.string().uuid("Invalid Permission ID"),
});
