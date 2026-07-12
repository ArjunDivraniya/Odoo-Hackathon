import { prisma } from "../../../config/prisma";
import { PermissionType } from "@prisma/client";

export class PermissionRepository {
  public async create(data: {
    module: string;
    action: string;
    field?: string;
    type?: PermissionType;
    description?: string;
  }) {
    const slug = data.field ? `${data.module}:${data.action}:${data.field}` : `${data.module}:${data.action}`;
    const name = slug.replace(/:/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    return prisma.permission.create({
      data: {
        name,
        slug,
        module: data.module,
        action: data.action,
        field: data.field || null,
        type: data.type || PermissionType.MODULE,
        description: data.description || null,
      },
    });
  }

  public async update(id: string, data: any) {
    const updateData = { ...data };
    if (data.module || data.action || data.field !== undefined) {
      const existing = await this.findById(id);
      if (existing) {
        const module = data.module || existing.module;
        const action = data.action || existing.action;
        const field = data.field !== undefined ? data.field : existing.field;
        updateData.slug = field ? `${module}:${action}:${field}` : `${module}:${action}`;
        updateData.name = updateData.slug.replace(/:/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }
    return prisma.permission.update({
      where: { id },
      data: updateData,
    });
  }

  public async delete(id: string) {
    return prisma.permission.delete({
      where: { id },
    });
  }

  public async findById(id: string) {
    return prisma.permission.findFirst({
      where: { id },
    });
  }

  public async findUnique(module: string, action: string, field?: string, type?: PermissionType) {
    return prisma.permission.findFirst({
      where: {
        module,
        action,
        field: field || null,
        type: type || PermissionType.MODULE,
      },
    });
  }

  public async findMany() {
    return prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });
  }

  public async assignToRole(roleId: string, permissionId: string) {
    return prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      create: {
        roleId,
        permissionId,
      },
      update: {},
    });
  }
}
