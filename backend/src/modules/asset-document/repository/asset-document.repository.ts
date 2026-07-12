import { prisma } from "../../../config/prisma";

export class AssetDocumentRepository {
  public async create(data: any) {
    return prisma.assetDocument.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  public async update(id: string, data: any) {
    return prisma.assetDocument.update({
      where: { id },
      data,
    });
  }

  public async softDelete(id: string) {
    return prisma.assetDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  public async findById(id: string) {
    return prisma.assetDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByAsset(assetId: string) {
    return prisma.assetDocument.findMany({
      where: { assetId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  public async findByAssetAndType(assetId: string, documentType: string) {
    return prisma.assetDocument.findMany({
      where: { assetId, documentType, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
