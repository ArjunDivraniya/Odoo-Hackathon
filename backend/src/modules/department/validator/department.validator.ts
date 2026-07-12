import { z } from "zod";
import { DepartmentStatus } from "@prisma/client";

export const createDepartmentSchema = z.object({
  companyId: z.string().uuid("Invalid Company ID"),
  parentId: z.string().uuid("Invalid Parent ID").optional().nullable(),
  officeId: z.string().uuid("Invalid Office ID").optional().nullable(),
  name: z.string().min(1, "Department name is required").max(200),
  code: z.string().min(1, "Department code is required").max(20),
  description: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(DepartmentStatus).optional(),
  headId: z.string().uuid("Invalid Head ID").optional().nullable(),
  budget: z.number().positive().optional().nullable(),
  costCenter: z.string().max(50).optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().omit({ companyId: true });
