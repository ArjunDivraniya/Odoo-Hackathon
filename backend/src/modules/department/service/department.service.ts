import { DepartmentRepository } from "../repository/department.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { prisma } from "../../../config/prisma";

export class DepartmentService {
  private repository = new DepartmentRepository();

  public async createDepartment(data: any, currentUserId: string, companyId: string) {
    // 1. Verify Company exists
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, deletedAt: null },
    });
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    // 2. Verify Office exists if provided
    if (data.officeId) {
      const office = await prisma.office.findFirst({
        where: { id: data.officeId, deletedAt: null },
      });
      if (!office) {
        throw new NotFoundError("Office not found");
      }
    }

    // 3. Verify Parent Department exists if provided
    if (data.parentId) {
      const parent = await prisma.department.findFirst({
        where: { id: data.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundError("Parent department not found");
      }
    }

    // 4. Verify unique department code per company
    const existing = await this.repository.findByCompanyAndCode(data.companyId, data.code);
    if (existing) {
      throw new ConflictError(`Department code "${data.code}" already exists in this company`);
    }

    const department = await this.repository.create(data, currentUserId);

    // Logging & Notifications
    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: department.id,
      entityName: department.name,
      newValue: department,
    });

    await NotificationTrigger.onDepartmentCreated(department.id, department.name, data.companyId);

    return department;
  }

  public async updateDepartment(id: string, data: any, currentUserId: string, companyId: string) {
    const department = await this.repository.findById(id);
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    // Verify Office exists if provided
    if (data.officeId) {
      const office = await prisma.office.findFirst({
        where: { id: data.officeId, deletedAt: null },
      });
      if (!office) {
        throw new NotFoundError("Office not found");
      }
    }

    // Handle Parent ID modification validations
    if (data.parentId !== undefined && data.parentId !== department.parentId) {
      if (data.parentId === id) {
        throw new BadRequestError("A department cannot be its own parent.");
      }

      if (data.parentId) {
        // Verify parent exists
        const parent = await prisma.department.findFirst({
          where: { id: data.parentId, deletedAt: null },
        });
        if (!parent) {
          throw new NotFoundError("Parent department not found");
        }

        // Cycle Check: Verify the new parent is not a descendant of this department
        const cycleCheck = await prisma.departmentHierarchy.findFirst({
          where: {
            ancestorId: id,
            descendantId: data.parentId,
          },
        });
        if (cycleCheck) {
          throw new BadRequestError("Cyclic relationship detected. Cannot assign a descendant as a parent department.");
        }
      }
    }

    // Check unique code if code changes
    if (data.code && data.code !== department.code) {
      const existing = await this.repository.findByCompanyAndCode(department.companyId, data.code);
      if (existing) {
        throw new ConflictError(`Department code "${data.code}" already exists in this company`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId: department.companyId,
      userId: currentUserId,
      action: "DEPARTMENT_UPDATED",
      entityType: "Department",
      entityId: id,
      entityName: updated.name,
      oldValue: department,
      newValue: data,
    });

    return updated;
  }

  public async deleteDepartment(id: string, currentUserId: string, companyId: string) {
    const department = await this.repository.findById(id);
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId: department.companyId,
      userId: currentUserId,
      action: "DEPARTMENT_DELETED",
      entityType: "Department",
      entityId: id,
      entityName: department.name,
    });

    return { success: true };
  }

  public async getDepartmentById(id: string) {
    const department = await this.repository.findById(id);
    if (!department) {
      throw new NotFoundError("Department not found");
    }
    return department;
  }

  public async getDepartments(companyId: string) {
    return this.repository.findMany(companyId);
  }

  // === HIERARCHY GETTERS ===

  public async getDepartmentHierarchy(id: string) {
    const department = await this.repository.findById(id);
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    const ancestors = await this.repository.getAncestors(id);
    const descendants = await this.repository.getDescendants(id);

    return {
      ancestors: ancestors.map((a) => ({
        id: a.ancestor.id,
        name: a.ancestor.name,
        code: a.ancestor.code,
        depth: a.depth,
      })),
      descendants: descendants.map((d) => ({
        id: d.descendant.id,
        name: d.descendant.name,
        code: d.descendant.code,
        depth: d.depth,
      })),
    };
  }
}
