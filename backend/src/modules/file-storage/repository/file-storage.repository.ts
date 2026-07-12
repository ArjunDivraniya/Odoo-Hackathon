import { prisma } from "../../../config/prisma";

export class FileStorageRepository {
  public async create(data: any) {
    const record = await prisma.fileStorage.create({ data });
    return this.serialize(record);
  }

  public async findById(id: string) {
    const record = await prisma.fileStorage.findFirst({
      where: { id, deletedAt: null },
    });
    return this.serialize(record);
  }

  public async findMany(
    companyId: string,
    filters: any,
    page: number,
    limit: number
  ) {
    const where: any = { companyId, deletedAt: null };

    if (filters.mimeType) {
      where.mimeType = filters.mimeType;
    }
    if (filters.isPublic !== undefined && filters.isPublic !== null) {
      where.isPublic = filters.isPublic;
    }
    if (filters.search) {
      where.originalName = { contains: filters.search, mode: "insensitive" };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

    const skip = (page - 1) * limit;

    const [records, total] = await prisma.$transaction([
      prisma.fileStorage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.fileStorage.count({ where }),
    ]);

    return {
      data: records.map((r: any) => this.serialize(r)),
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async incrementAccess(id: string) {
    return prisma.fileStorage.update({
      where: { id },
      data: { accessCount: { increment: 1 } },
    });
  }

  public async softDelete(id: string) {
    return prisma.fileStorage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private serialize(record: any) {
    if (!record) return record;
    return {
      ...record,
      fileSize:
        record.fileSize !== null && record.fileSize !== undefined
          ? Number(record.fileSize)
          : record.fileSize,
    };
  }
}
