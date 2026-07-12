import { prisma } from "../../../config/prisma";
import { RoleType } from "@prisma/client";

export class RoleRepository {
  public async create(data: {
    name: string;
    description?: string;
    type?: RoleType;
    isDefault?: boolean;
    isActive?: boolean;
    companyId?: string;
  }) {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type || RoleType.CUSTOM,
        isDefault: data.isDefault || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        companyId: data.companyId || null,
      },
    });
  }

  public async update(id: string, data: any) {
    return prisma.role.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string) {
    return prisma.role.delete({
      where: { id },
    });
  }

  public async findById(id: string) {
    return prisma.role.findFirst({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  public async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  public async findMany(companyId?: string) {
    return prisma.role.findMany({
      where: {
        OR: [
          { companyId: null }, // system or template default roles
          companyId ? { companyId } : {},
        ],
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // === ROLE-PERMISSION JUNCTION ===

  public async assignPermission(roleId: string, permissionId: string) {
    return prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
      create: {
        roleId,
        permissionId,
      },
      update: {}, // do nothing if already exists
    });
  }

  public async removePermission(roleId: string, permissionId: string) {
    return prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });
  }
}
