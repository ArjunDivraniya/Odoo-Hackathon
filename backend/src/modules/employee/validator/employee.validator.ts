import { z } from "zod";
import { EmployeeStatus } from "@prisma/client";

export const createEmployeeSchema = z.object({
  userId: z.string().uuid("Invalid User ID"),
  companyId: z.string().uuid("Invalid Company ID"),
  employeeId: z.string().min(1, "Employee ID code is required").max(50),
  departmentId: z.string().uuid("Invalid Department ID").optional().nullable(),
  officeId: z.string().uuid("Invalid Office ID").optional().nullable(),
  managerId: z.string().uuid("Invalid Manager ID").optional().nullable(),
  jobTitle: z.string().max(200).optional().nullable(),
  jobLevel: z.string().max(50).optional().nullable(),
  employmentType: z.string().max(50).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  hireDate: z.string().transform((val) => new Date(val)),
  terminationDate: z.string().transform((val) => new Date(val)).optional().nullable(),
  salary: z.number().positive().optional().nullable(),
  emergencyContact: z.any().optional().nullable(),
  address: z.any().optional().nullable(),
  documents: z.any().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ companyId: true, userId: true });
