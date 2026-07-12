import { prisma } from "../../../config/prisma";

export class EmailRepository {
  public async findMany(filters?: any) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  public async findById(id: string) {
    return prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  public async findByName(name: string) {
    return prisma.emailTemplate.findUnique({
      where: { name },
    });
  }

  public async create(data: any) {
    return prisma.emailTemplate.create({
      data,
    });
  }

  public async update(id: string, data: any) {
    return prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string) {
    return prisma.emailTemplate.delete({
      where: { id },
    });
  }
}
