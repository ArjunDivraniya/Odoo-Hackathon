import { prisma } from "../../../config/prisma";

export class AssetQrCodeRepository {
  public async create(data: any) {
    return prisma.assetQrCode.create({
      data: {
        ...data,
        format: data.format || "QR_CODE",
        scanCount: 0,
        isActive: true,
      },
    });
  }

  public async findByAsset(assetId: string) {
    return prisma.assetQrCode.findFirst({
      where: { assetId, deletedAt: null },
    });
  }

  public async findByCode(code: string) {
    return prisma.assetQrCode.findFirst({
      where: { code, deletedAt: null },
      include: {
        asset: {
          include: {
            category: true,
            office: true,
          },
        },
      },
    });
  }

  public async incrementScanCount(code: string, userId: string) {
    return prisma.assetQrCode.update({
      where: { code },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
        lastScannedBy: userId,
      },
    });
  }

  public async deactivate(id: string) {
    return prisma.assetQrCode.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  public async findActive() {
    return prisma.assetQrCode.findMany({
      where: { isActive: true, deletedAt: null },
    });
  }
}
