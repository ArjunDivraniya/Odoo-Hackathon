import { RoleType } from "@prisma/client";
import { RoleRepository } from "../repository/role.repository";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class RoleService {
  private repository = new RoleRepository();

  public async createRole(data: any, currentUserId: string, companyId: string) {
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new ConflictError(`Role "${data.name}" already exists`);
    }

    const role = await this.repository.create({
      ...data,
      type: RoleType.CUSTOM, // API creations are always CUSTOM
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ROLE_CREATED",
      entityType: "Role",
      entityId: role.id,
      entityName: role.name,
      newValue: role,
    });

    return role;
  }

  public async updateRole(id: string, data: any, currentUserId: string, companyId: string) {
    const role = await this.repository.findById(id);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (role.type === RoleType.SYSTEM) {
      throw new BadRequestError("System roles cannot be modified.");
    }

    if (data.name && data.name !== role.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing) {
        throw new ConflictError(`Role "${data.name}" already exists`);
      }
    }

    const updated = await this.repository.update(id, data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ROLE_UPDATED",
      entityType: "Role",
      entityId: id,
      entityName: updated.name,
      oldValue: { name: role.name, description: role.description, isActive: role.isActive },
      newValue: data,
    });

    return updated;
  }

  public async deleteRole(id: string, currentUserId: string, companyId: string) {
    const role = await this.repository.findById(id);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (role.type === RoleType.SYSTEM) {
      throw new BadRequestError("System roles cannot be deleted.");
    }

    await this.repository.delete(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ROLE_DELETED",
      entityType: "Role",
      entityId: id,
      entityName: role.name,
    });

    return { success: true };
  }

  public async getRoleById(id: string) {
    const role = await this.repository.findById(id);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    return role;
  }

  public async getRoles(companyId: string) {
    return this.repository.findMany(companyId);
  }

  // === ROLE PERMISSIONS ===

  public async assignPermission(roleId: string, permissionId: string, currentUserId: string, companyId: string) {
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (role.type === RoleType.SYSTEM) {
      throw new BadRequestError("System role permissions cannot be modified.");
    }

    const perm = await prisma.permission.findFirst({
      where: { id: permissionId },
    });
    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    await this.repository.assignPermission(roleId, permissionId);

    const permSlug = perm.field ? `${perm.module}:${perm.action}:${perm.field}` : `${perm.module}:${perm.action}`;

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "PERMISSION_CHANGED",
      entityType: "Role",
      entityId: roleId,
      entityName: role.name,
      metadata: { action: "ASSIGN", permissionId, permission: permSlug },
    });

    return { success: true };
  }

  public async removePermission(roleId: string, permissionId: string, currentUserId: string, companyId: string) {
    const role = await this.repository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (role.type === RoleType.SYSTEM) {
      throw new BadRequestError("System role permissions cannot be modified.");
    }

    const perm = await prisma.permission.findFirst({
      where: { id: permissionId },
    });
    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    await this.repository.removePermission(roleId, permissionId);

    const permSlug = perm.field ? `${perm.module}:${perm.action}:${perm.field}` : `${perm.module}:${perm.action}`;

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "PERMISSION_CHANGED",
      entityType: "Role",
      entityId: roleId,
      entityName: role.name,
      metadata: { action: "REVOKE", permissionId, permission: permSlug },
    });

    return { success: true };
  }
}
