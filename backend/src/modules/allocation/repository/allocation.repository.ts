import { prisma } from "../../../config/prisma";

export class AllocationRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.assetAllocation.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.assetAllocation.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.assetAllocation.findFirst({
      where: { id, deletedAt: null },
      include: {
        asset: true,
        user: true,
        allocatedByUser: true,
        approver: true,
        history: true,
      },
    });
  }

  public async findByAssetAndStatus(assetId: string, status: string) {
    return prisma.assetAllocation.findFirst({
      where: { assetId, status: status as any, deletedAt: null },
    });
  }

  public async findActiveByEmployee(employeeId: string) {
    return prisma.assetAllocation.findMany({
      where: {
        employeeId,
        status: { in: ["ACTIVE", "PENDING"] },
        deletedAt: null,
      },
    });
  }

  public async findMany(companyId: string, filters?: any) {
    const where: any = { deletedAt: null };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters?.assetId) {
      where.assetId = filters.assetId;
    }
    if (filters?.approvalStatus) {
      where.approvalStatus = filters.approvalStatus;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.assetAllocation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          asset: true,
          user: true,
          allocatedByUser: true,
          approver: true,
        },
      }),
      prisma.assetAllocation.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async createHistory(data: any) {
    return prisma.allocationHistory.create({
      data,
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.assetAllocation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }
}
