import { prisma } from "../../../config/prisma";

export class DepartmentRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.$transaction(async (tx) => {
      const dept = await tx.department.create({
        data: {
          companyId: data.companyId,
          parentId: data.parentId || null,
          officeId: data.officeId || null,
          name: data.name,
          code: data.code,
          description: data.description || null,
          status: data.status || "ACTIVE",
          headId: data.headId || null,
          budget: data.budget || null,
          costCenter: data.costCenter || null,
          createdBy,
        },
      });

      // Insert self-relationship in closure table
      await tx.departmentHierarchy.create({
        data: {
          ancestorId: dept.id,
          descendantId: dept.id,
          depth: 0,
        },
      });

      // If there is a parent department, insert relationships for all its ancestors
      if (data.parentId) {
        const parentAncestors = await tx.departmentHierarchy.findMany({
          where: { descendantId: data.parentId },
        });

        for (const ancestorRow of parentAncestors) {
          await tx.departmentHierarchy.create({
            data: {
              ancestorId: ancestorRow.ancestorId,
              descendantId: dept.id,
              depth: ancestorRow.depth + 1,
            },
          });
        }
      }

      return dept;
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.$transaction(async (tx) => {
      const original = await tx.department.findUnique({ where: { id } });
      if (!original) throw new Error("Department not found");

      // Perform standard update
      const updated = await tx.department.update({
        where: { id },
        data: {
          officeId: data.officeId !== undefined ? data.officeId : undefined,
          name: data.name,
          code: data.code,
          description: data.description,
          status: data.status,
          headId: data.headId,
          budget: data.budget,
          costCenter: data.costCenter,
          updatedBy,
        },
      });

      // If parentId is modified, update the hierarchy tree
      if (data.parentId !== undefined && data.parentId !== original.parentId) {
        await this.updateHierarchy(tx, id, data.parentId);
        await tx.department.update({
          where: { id },
          data: { parentId: data.parentId },
        });
      }

      return updated;
    });
  }

  private async updateHierarchy(tx: any, departmentId: string, newParentId: string | null) {
    // 1. Find all descendants of the department (including itself)
    const descendants = await tx.departmentHierarchy.findMany({
      where: { ancestorId: departmentId },
    });
    const descendantIds = descendants.map((d: any) => d.descendantId);

    // 2. Find all ancestors of the department (excluding itself)
    const ancestors = await tx.departmentHierarchy.findMany({
      where: { descendantId: departmentId, ancestorId: { not: departmentId } },
    });
    const ancestorIds = ancestors.map((a: any) => a.ancestorId);

    // 3. Delete all links between ancestors and descendants
    if (ancestorIds.length > 0) {
      await tx.departmentHierarchy.deleteMany({
        where: {
          ancestorId: { in: ancestorIds },
          descendantId: { in: descendantIds },
        },
      });
    }

    // 4. If there is a new parent, link new ancestors to descendants
    if (newParentId) {
      // Find new ancestors (including the new parent itself)
      const newAncestors = await tx.departmentHierarchy.findMany({
        where: { descendantId: newParentId },
      });

      // For each new ancestor and descendant, insert relationship
      for (const newAncestorRow of newAncestors) {
        for (const descRow of descendants) {
          await tx.departmentHierarchy.create({
            data: {
              ancestorId: newAncestorRow.ancestorId,
              descendantId: descRow.descendantId,
              // depth = depth(newAncestor -> newParent) + depth(departmentId -> descendant) + 1
              depth: newAncestorRow.depth + descRow.depth + 1,
            },
          });
        }
      }
    }
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.$transaction(async (tx) => {
      // Soft delete department
      const dept = await tx.department.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy,
        },
      });

      // Delete all hierarchy records associated with this department (it is soft deleted, tree collapses)
      await tx.departmentHierarchy.deleteMany({
        where: {
          OR: [{ ancestorId: id }, { descendantId: id }],
        },
      });

      return dept;
    });
  }

  public async findById(id: string) {
    return prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByCompanyAndCode(companyId: string, code: string) {
    return prisma.department.findFirst({
      where: { companyId, code, deletedAt: null },
    });
  }

  public async findMany(companyId: string) {
    return prisma.department.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  // === HIERARCHY QUERIES ===

  public async getAncestors(departmentId: string) {
    return prisma.departmentHierarchy.findMany({
      where: { descendantId: departmentId, ancestorId: { not: departmentId } },
      include: {
        ancestor: true,
      },
      orderBy: { depth: "desc" }, // root down to parent
    });
  }

  public async getDescendants(departmentId: string) {
    return prisma.departmentHierarchy.findMany({
      where: { ancestorId: departmentId, descendantId: { not: departmentId } },
      include: {
        descendant: true,
      },
      orderBy: { depth: "asc" }, // direct children first, then grandchildren
    });
  }
}
