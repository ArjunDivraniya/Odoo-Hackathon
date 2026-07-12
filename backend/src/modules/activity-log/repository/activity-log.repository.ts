import { prisma } from "../../../config/prisma";
import { ActivityLogFilter } from "../types/activity-log.types";

export class ActivityLogRepository {
  public async create(data: any) {
    return prisma.activityLog.create({
      data: {
        companyId: data.companyId,
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        entityName: data.entityName ?? null,
        oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : null,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        deviceInfo: data.deviceInfo ? JSON.parse(JSON.stringify(data.deviceInfo)) : null,
        requestId: data.requestId ?? null,
        durationMs: data.durationMs ?? null,
        status: data.status || "SUCCESS",
        errorMessage: data.errorMessage ?? null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
    });
  }

  public async findManyForCompany(
    companyId: string,
    filters: ActivityLogFilter,
    page: number,
    limit: number,
    includeData = true
  ) {
    const where: any = { companyId };

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: "insensitive" } },
        { entityType: { contains: filters.search, mode: "insensitive" } },
        { entityName: { contains: filters.search, mode: "insensitive" } },
      ];
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

    const total = await prisma.activityLog.count({ where });

    let logs: any[] = [];
    if (includeData) {
      logs = await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
    }

    return { logs, total };
  }

  public async findById(id: string, companyId: string) {
    return prisma.activityLog.findFirst({
      where: { id, companyId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  public async findByUser(userId: string, companyId: string, filters: ActivityLogFilter, page: number, limit: number) {
    const where: any = { userId, companyId };

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const total = await prisma.activityLog.count({ where });
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { logs, total };
  }

  public async findByEntity(entityType: string, entityId: string, companyId: string, page: number, limit: number) {
    const where: any = { entityType, entityId, companyId };
    const total = await prisma.activityLog.count({ where });
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { logs, total };
  }

  public async findAuditByEntityId(entityId: string, companyId: string, page: number, limit: number) {
    const where: any = {
      entityId,
      companyId,
      entityType: { startsWith: "Audit" },
    };
    const total = await prisma.activityLog.count({ where });
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { logs, total };
  }
}
