import { prisma } from "../../../config/prisma";

export class CompanyRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.company.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.company.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.company.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findBySlug(slug: string) {
    return prisma.company.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  public async findMany() {
    return prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
