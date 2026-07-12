import { prisma } from "../../../config/prisma";

export class TransferRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.transferRequest.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.transferRequest.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.transferRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        asset: true,
        requestedByUser: true,
        approvedByUser: true,
        receivedByUser: true,
        history: true,
      },
    });
  }

  public async findMany(companyId: string, filters?: any) {
    const where: any = { companyId, deletedAt: null };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.assetId) {
      where.assetId = filters.assetId;
    }
    if (filters?.fromOfficeId) {
      where.fromOfficeId = filters.fromOfficeId;
    }
    if (filters?.toOfficeId) {
      where.toOfficeId = filters.toOfficeId;
    }

    return prisma.transferRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        asset: true,
        requestedByUser: true,
        approvedByUser: true,
        receivedByUser: true,
      },
    });
  }

  public async createHistory(data: any) {
    return prisma.transferHistory.create({
      data,
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.transferRequest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findPendingByAsset(assetId: string) {
    return prisma.transferRequest.findFirst({
      where: {
        assetId,
        status: { in: ["REQUESTED", "APPROVED", "IN_TRANSIT"] },
        deletedAt: null,
      },
    });
  }
}
