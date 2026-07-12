import { prisma } from "../../../config/prisma";

export class AssetRepository {
  public async create(data: any, createdBy?: string) {
    if (!data.assetTag) {
      const random = require("crypto").randomBytes(4).toString("hex").toUpperCase();
      data.assetTag = `AST-${random}`;
    }
    return prisma.asset.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.asset.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.asset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        office: true,
        qrCode: true,
        images: true,
        documents: true,
      },
    });
  }

  public async findByAssetTag(companyId: string, assetTag: string) {
    return prisma.asset.findFirst({
      where: { companyId, assetTag, deletedAt: null },
    });
  }

  public async findByBarcode(barcode: string) {
    return prisma.asset.findFirst({
      where: { barcode, deletedAt: null },
    });
  }

  public async findMany(companyId: string, filters?: any) {
    const where: any = { companyId, deletedAt: null };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.officeId) {
      where.officeId = filters.officeId;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { assetTag: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        office: true,
      },
    });
  }

  public async findAllocations(assetId: string) {
    return prisma.assetAllocation.findMany({
      where: { assetId, isActive: true },
    });
  }
}
