import { z } from "zod";
import { UserStatus } from "@prisma/client";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email").max(255).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid("Invalid Role ID"),
  companyId: z.string().uuid("Invalid Company ID").optional(),
});

export const bulkStatusSchema = z.object({
  userIds: z.array(z.string().uuid("Invalid User ID")).min(1, "At least one user ID is required"),
});
