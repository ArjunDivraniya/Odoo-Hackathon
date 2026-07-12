import { prisma } from "../../../config/prisma";

export class OfficeRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.office.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.office.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.office.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.office.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByCompanyAndCode(companyId: string, code: string) {
    return prisma.office.findFirst({
      where: { companyId, code, deletedAt: null },
    });
  }

  public async findMany(companyId: string) {
    return prisma.office.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
