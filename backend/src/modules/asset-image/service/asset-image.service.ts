import { AssetImageRepository } from "../repository/asset-image.repository";
import { NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AssetImageService {
  private repository = new AssetImageRepository();

  public async createImage(data: any, currentUserId: string, companyId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    const image = await this.repository.create(data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_IMAGE_CREATED",
      entityType: "AssetImage",
      entityId: image.id,
      entityName: image.caption || "Asset Image",
      newValue: image,
    });

    return image;
  }

  public async updateImage(id: string, data: any, currentUserId: string, companyId: string) {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new NotFoundError("Asset image not found");
    }

    const updated = await this.repository.update(id, data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_IMAGE_UPDATED",
      entityType: "AssetImage",
      entityId: id,
      entityName: updated.caption || "Asset Image",
      oldValue: image,
      newValue: data,
    });

    return updated;
  }

  public async deleteImage(id: string, currentUserId: string, companyId: string) {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new NotFoundError("Asset image not found");
    }

    await this.repository.softDelete(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_IMAGE_DELETED",
      entityType: "AssetImage",
      entityId: id,
      entityName: image.caption || "Asset Image",
    });

    return { success: true };
  }

  public async getImageById(id: string) {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new NotFoundError("Asset image not found");
    }
    return image;
  }

  public async getImagesByAsset(assetId: string) {
    return this.repository.findByAsset(assetId);
  }

  public async setPrimaryImage(id: string, currentUserId: string, companyId: string) {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new NotFoundError("Asset image not found");
    }

    const updated = await this.repository.setPrimary(image.assetId, id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_IMAGE_PRIMARY_SET",
      entityType: "AssetImage",
      entityId: id,
      entityName: image.caption || "Asset Image",
    });

    return updated;
  }
}
