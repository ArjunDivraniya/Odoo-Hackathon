import { prisma } from "../../../config/prisma";

export class LocationRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.location.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.location.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.location.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.location.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByFloorAndCode(floorId: string, code: string) {
    return prisma.location.findFirst({
      where: { floorId, code, deletedAt: null },
    });
  }

  public async findMany(companyId: string) {
    return prisma.location.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
