import crypto from "crypto";
import { AssetQrCodeRepository } from "../repository/asset-qr.repository";
import { NotFoundError, ConflictError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AssetQrCodeService {
  private repository = new AssetQrCodeRepository();

  public async generateQrCode(data: any, currentUserId: string, companyId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    const existing = await this.repository.findByAsset(data.assetId);
    if (existing) {
      throw new ConflictError("Asset already has a QR code");
    }

    let code = crypto.randomBytes(16).toString("hex");
    const qr = await this.repository.create({
      assetId: data.assetId,
      code,
      format: data.format || "QR_CODE",
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_QR_GENERATED",
      entityType: "AssetQrCode",
      entityId: qr.id,
      entityName: qr.code,
      newValue: qr,
    });

    return qr;
  }

  public async scanQrCode(code: string, currentUserId: string) {
    const qr = await this.repository.findByCode(code);
    if (!qr) {
      throw new NotFoundError("QR code not found");
    }

    if (!qr.isActive) {
      throw new ConflictError("QR code is inactive");
    }

    await this.repository.incrementScanCount(code, currentUserId);

    return {
      qr: {
        ...qr,
        scanCount: qr.scanCount + 1,
        lastScannedAt: new Date(),
        lastScannedBy: currentUserId,
      },
      asset: qr.asset,
    };
  }

  public async getQrByAssetId(assetId: string) {
    const qr = await this.repository.findByAsset(assetId);
    if (!qr) {
      throw new NotFoundError("QR code not found for this asset");
    }
    return qr;
  }

  public async deactivateQr(id: string, currentUserId: string, companyId: string) {
    const qr = await this.repository.findByAsset(id);
    if (!qr) {
      throw new NotFoundError("QR code not found");
    }

    await this.repository.deactivate(qr.id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_QR_DEACTIVATED",
      entityType: "AssetQrCode",
      entityId: qr.id,
      entityName: qr.code,
    });

    return { success: true };
  }
}
