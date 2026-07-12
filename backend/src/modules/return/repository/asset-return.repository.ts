import { prisma } from "../../../config/prisma";

export class AssetReturnRepository {
  public async create(data: any) {
    return prisma.assetReturn.create({
      data,
    });
  }

  public async update(id: string, data: any) {
    return prisma.assetReturn.update({
      where: { id },
      data,
    });
  }

  public async findById(id: string) {
    return prisma.assetReturn.findFirst({
      where: { id },
      include: {
        allocation: true,
        asset: true,
      },
    });
  }

  public async findByAllocationId(allocationId: string) {
    return prisma.assetReturn.findFirst({
      where: { allocationId },
    });
  }

  public async findMany(companyId: string, filters?: any) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.assetId) {
      where.assetId = filters.assetId;
    }
    if (filters?.allocationId) {
      where.allocationId = filters.allocationId;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.assetReturn.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          allocation: true,
          asset: true,
        },
      }),
      prisma.assetReturn.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async findByAssetId(assetId: string) {
    return prisma.assetReturn.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      include: {
        allocation: true,
      },
    });
  }
}
