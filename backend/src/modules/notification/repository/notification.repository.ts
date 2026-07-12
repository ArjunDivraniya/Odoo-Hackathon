import { prisma } from "../../../config/prisma";
import { NotificationStatus, PriorityLevel } from "@prisma/client";
import { NotificationFilter } from "../types/notification.types";

export class NotificationRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.notification.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async createForUser(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority?: PriorityLevel;
    entityType?: string | null;
    entityId?: string | null;
    actionUrl?: string | null;
    metadata?: any;
    expiresAt?: Date | null;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        status: NotificationStatus.UNREAD,
        priority: data.priority || PriorityLevel.MEDIUM,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        actionUrl: data.actionUrl || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        expiresAt: data.expiresAt || null,
      },
    });
  }

  public async findById(id: string, userId?: string) {
    return prisma.notification.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(userId ? { userId } : {}),
      },
    });
  }

  public async findManyForUser(userId: string, filters: NotificationFilter, page: number, limit: number) {
    const where: any = { userId, deletedAt: null };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.unreadOnly) {
      where.status = NotificationStatus.UNREAD;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications, total };
  }

  public async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, status: NotificationStatus.UNREAD, deletedAt: null },
    });
  }

  public async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null, status: { not: NotificationStatus.READ } },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  public async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.UNREAD, deletedAt: null },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  public async softDelete(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  public async getPreference(userId: string) {
    return prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  public async upsertPreference(userId: string, data: any) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  public async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  public async getEmailTemplateByType(type: string) {
    return prisma.emailTemplate.findFirst({
      where: { category: type, isActive: true },
    });
  }
}
