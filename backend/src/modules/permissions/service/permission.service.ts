import { PermissionRepository } from "../repository/permission.repository";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class PermissionService {
  private repository = new PermissionRepository();

  public async createPermission(data: any, currentUserId: string, companyId: string) {
    const existing = await this.repository.findUnique(
      data.module,
      data.action,
      data.field,
      data.type
    );
    if (existing) {
      throw new ConflictError("This permission configuration already exists");
    }

    const perm = await this.repository.create(data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "PERMISSION_CREATED",
      entityType: "Permission",
      entityId: perm.id,
      entityName: `${perm.module}:${perm.action}`,
      newValue: perm,
    });

    return perm;
  }

  public async updatePermission(id: string, data: any, currentUserId: string, companyId: string) {
    const perm = await this.repository.findById(id);
    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    const updated = await this.repository.update(id, data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "PERMISSION_UPDATED",
      entityType: "Permission",
      entityId: id,
      entityName: `${updated.module}:${updated.action}`,
      oldValue: perm,
      newValue: data,
    });

    return updated;
  }

  public async deletePermission(id: string, currentUserId: string, companyId: string) {
    const perm = await this.repository.findById(id);
    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    await this.repository.delete(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "PERMISSION_DELETED",
      entityType: "Permission",
      entityId: id,
      entityName: `${perm.module}:${perm.action}`,
    });

    return { success: true };
  }

  public async getPermissions() {
    return this.repository.findMany();
  }

  public async assignPermissionToRole(roleId: string, permissionId: string, currentUserId: string, companyId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const perm = await this.repository.findById(permissionId);
    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    if (role.type === "SYSTEM") {
      throw new BadRequestError("System role permissions cannot be modified.");
    }

    await this.repository.assignToRole(roleId, permissionId);

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
}
