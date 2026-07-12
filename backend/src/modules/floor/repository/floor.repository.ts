import { prisma } from "../../../config/prisma";

export class FloorRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.floor.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.floor.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.floor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.floor.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByBuildingAndLevel(buildingId: string, levelNumber: number) {
    return prisma.floor.findFirst({
      where: { buildingId, levelNumber, deletedAt: null },
    });
  }

  public async findMany(companyId: string) {
    return prisma.floor.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { levelNumber: "asc" },
    });
  }
}
