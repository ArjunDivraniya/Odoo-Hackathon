import * as bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { UserRepository, GetUsersFilter } from "../repository/user.repository";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { prisma } from "../../../config/prisma";

export class UserService {
  private repository = new UserRepository();

  public async createUser(data: any, currentUserId: string, companyId: string) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("Email is already in use");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.repository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      status: data.status,
    });

    // Write audit trail
    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      entityName: `${user.firstName} ${user.lastName}`,
      newValue: { email: user.email, firstName: user.firstName, status: user.status },
    });

    // Trigger notification
    await NotificationTrigger.onUserCreated(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  public async updateUser(id: string, data: any, currentUserId: string, companyId: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError("Email is already in use");
      }
    }

    const updated = await this.repository.update(id, data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      entityName: `${updated.firstName} ${updated.lastName}`,
      oldValue: { email: user.email, firstName: user.firstName, status: user.status },
      newValue: data,
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      status: updated.status,
    };
  }

  public async deleteUser(id: string, currentUserId: string, companyId: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.repository.softDelete(id);

    // Force terminate user sessions upon deletion
    await prisma.session.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      entityName: `${user.firstName} ${user.lastName}`,
    });

    return { success: true };
  }

  public async getUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  public async getUsers(filter: GetUsersFilter) {
    return this.repository.findMany(filter);
  }

  public async bulkActivate(userIds: string[], currentUserId: string, companyId: string) {
    await this.repository.updateBulkStatus(userIds, UserStatus.ACTIVE);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "USER_BULK_ACTIVATE",
      entityType: "User",
      metadata: { userIds },
    });

    return { success: true };
  }

  public async bulkDeactivate(userIds: string[], currentUserId: string, companyId: string) {
    await this.repository.updateBulkStatus(userIds, UserStatus.INACTIVE);

    // Force terminate all active sessions for deactivated users
    await prisma.session.updateMany({
      where: { userId: { in: userIds }, isActive: true },
      data: { isActive: false },
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "USER_BULK_DEACTIVATE",
      entityType: "User",
      metadata: { userIds },
    });

    return { success: true };
  }

  // === ROLE WORKFLOWS ===

  public async assignRole(
    userId: string,
    roleId: string,
    companyId: string,
    currentUserId: string
  ) {
    // Self-assignment lock block check
    if (userId === currentUserId) {
      throw new BadRequestError("You cannot assign roles to yourself.");
    }

    const targetUser = await this.repository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    const role = await prisma.role.findFirst({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    await this.repository.assignRole(userId, roleId, companyId, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ROLE_ASSIGNED",
      entityType: "User",
      entityId: userId,
      entityName: `${targetUser.firstName} ${targetUser.lastName}`,
      metadata: { roleId, roleName: role.name, companyId },
    });

    await NotificationTrigger.onRoleAssigned(userId, role.name, currentUserId);

    return { success: true };
  }

  public async removeRole(
    userId: string,
    roleId: string,
    companyId: string,
    currentUserId: string
  ) {
    // Self role removal lock check
    if (userId === currentUserId) {
      throw new BadRequestError("You cannot modify your own roles.");
    }

    const targetUser = await this.repository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    const role = await prisma.role.findFirst({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    await this.repository.removeRole(userId, roleId, companyId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ROLE_REVOKED",
      entityType: "User",
      entityId: userId,
      entityName: `${targetUser.firstName} ${targetUser.lastName}`,
      metadata: { roleId, roleName: role.name, companyId },
    });

    return { success: true };
  }

  public async getUserRoles(userId: string) {
    const targetUser = await this.repository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }
    return this.repository.findUserRoles(userId);
  }
}
