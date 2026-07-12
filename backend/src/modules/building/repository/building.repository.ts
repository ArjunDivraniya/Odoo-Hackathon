import { prisma } from "../../../config/prisma";

export class BuildingRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.building.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.building.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.building.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.building.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByOfficeAndCode(officeId: string, code: string) {
    return prisma.building.findFirst({
      where: { officeId, code, deletedAt: null },
    });
  }

  public async findMany(companyId: string) {
    return prisma.building.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
