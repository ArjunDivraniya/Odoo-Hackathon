import { z } from "zod";
import { PermissionType } from "@prisma/client";

export const createPermissionSchema = z.object({
  module: z.string().min(1, "Module name is required").max(100),
  action: z.string().min(1, "Action name is required").max(100),
  field: z.string().max(100).optional(),
  type: z.nativeEnum(PermissionType).optional(),
  description: z.string().max(500).optional(),
});

export const updatePermissionSchema = z.object({
  module: z.string().min(1).max(100).optional(),
  action: z.string().min(1).max(100).optional(),
  field: z.string().max(100).optional(),
  type: z.nativeEnum(PermissionType).optional(),
  description: z.string().max(500).optional(),
});

export const assignPermissionToRoleSchema = z.object({
  roleId: z.string().uuid("Invalid Role ID"),
  permissionId: z.string().uuid("Invalid Permission ID"),
});
