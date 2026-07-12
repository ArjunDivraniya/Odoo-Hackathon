import { prisma } from "../../../config/prisma";

export class ResourceRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.sharedResource.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.sharedResource.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.sharedResource.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.sharedResource.findFirst({
      where: { id, deletedAt: null },
      include: {
        bookings: {
          where: { deletedAt: null },
          orderBy: { startTime: "desc" },
        },
      },
    });
  }

  public async findByCompanyAndName(companyId: string, name: string) {
    return prisma.sharedResource.findFirst({
      where: { companyId, name, deletedAt: null },
    });
  }

  public async findMany(companyId: string, filters?: any) {
    const where: any = { companyId, deletedAt: null };

    if (filters?.resourceType) {
      where.resourceType = filters.resourceType;
    }
    if (filters?.officeId) {
      where.officeId = filters.officeId;
    }
    if (filters?.isBookable !== undefined) {
      where.isBookable = filters.isBookable;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.sharedResource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        asset: true,
      },
    });
  }
}
