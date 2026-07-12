import { prisma } from "../../../config/prisma";
import { UserStatus } from "@prisma/client";

export interface GetUsersFilter {
  q?: string; // Global search query
  status?: UserStatus;
  role?: string;
  companyId?: string;
  page?: number;
  limit?: number;
  sortBy?: "firstName" | "lastName" | "email" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export class UserRepository {
  public async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status?: UserStatus;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        status: data.status || UserStatus.PENDING_VERIFICATION,
      },
    });
  }

  public async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  public async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        employeeProfile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  public async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  public async findMany(filter: GetUsersFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Apply global search query
    if (filter.q) {
      where.OR = [
        { firstName: { contains: filter.q, mode: "insensitive" } },
        { lastName: { contains: filter.q, mode: "insensitive" } },
        { email: { contains: filter.q, mode: "insensitive" } },
      ];
    }

    // Apply exact status filter
    if (filter.status) {
      where.status = filter.status;
    }

    // Apply role name filter
    if (filter.role) {
      where.roles = {
        some: {
          role: {
            name: { contains: filter.role, mode: "insensitive" },
          },
        },
      };
    }

    // Apply company scoping filter if needed
    if (filter.companyId) {
      where.roles = {
        some: {
          companyId: filter.companyId,
        },
      };
    }

    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = filter.sortOrder || "desc";

    const items = await prisma.user.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const total = await prisma.user.count({ where });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  public async updateBulkStatus(userIds: string[], status: UserStatus) {
    return prisma.user.updateMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
      data: { status },
    });
  }

  // === USER ROLE ASSIGNMENTS ===

  public async assignRole(userId: string, roleId: string, companyId?: string, assignedBy?: string) {
    const compId = companyId || "00000000-0000-0000-0000-000000000000";
    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId, companyId: compId },
    });

    if (existing) {
      return prisma.userRole.update({
        where: { id: existing.id },
        data: { isActive: true, assignedBy },
      });
    }

    return prisma.userRole.create({
      data: {
        userId,
        roleId,
        companyId: compId,
        assignedBy,
        isActive: true,
      },
    });
  }

  public async removeRole(userId: string, roleId: string, companyId?: string) {
    const compId = companyId || "00000000-0000-0000-0000-000000000000";
    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId, companyId: compId },
    });

    if (existing) {
      return prisma.userRole.delete({
        where: { id: existing.id },
      });
    }
    return null;
  }

  public async findUserRoles(userId: string) {
    return prisma.userRole.findMany({
      where: { userId, isActive: true },
      include: {
        role: true,
      },
    });
  }
}
