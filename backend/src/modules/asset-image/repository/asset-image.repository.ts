import { prisma } from "../../../config/prisma";

export class AssetImageRepository {
  public async create(data: any) {
    return prisma.assetImage.create({
      data: {
        ...data,
        imageType: data.imageType || "GENERAL",
        isPrimary: data.isPrimary || false,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  public async update(id: string, data: any) {
    return prisma.assetImage.update({
      where: { id },
      data,
    });
  }

  public async softDelete(id: string) {
    return prisma.assetImage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  public async findById(id: string) {
    return prisma.assetImage.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByAsset(assetId: string) {
    return prisma.assetImage.findMany({
      where: { assetId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });
  }

  public async setPrimary(assetId: string, imageId: string) {
    await prisma.assetImage.updateMany({
      where: { assetId, deletedAt: null },
      data: { isPrimary: false },
    });

    return prisma.assetImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }
}
