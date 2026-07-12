import { AssetDocumentRepository } from "../repository/asset-document.repository";
import { NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AssetDocumentService {
  private repository = new AssetDocumentRepository();

  public async createDocument(data: any, currentUserId: string, companyId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    const document = await this.repository.create(data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_DOCUMENT_CREATED",
      entityType: "AssetDocument",
      entityId: document.id,
      entityName: document.title,
      newValue: document,
    });

    return document;
  }

  public async updateDocument(id: string, data: any, currentUserId: string, companyId: string) {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundError("Asset document not found");
    }

    const updated = await this.repository.update(id, data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_DOCUMENT_UPDATED",
      entityType: "AssetDocument",
      entityId: id,
      entityName: updated.title,
      oldValue: document,
      newValue: data,
    });

    return updated;
  }

  public async deleteDocument(id: string, currentUserId: string, companyId: string) {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundError("Asset document not found");
    }

    await this.repository.softDelete(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_DOCUMENT_DELETED",
      entityType: "AssetDocument",
      entityId: id,
      entityName: document.title,
    });

    return { success: true };
  }

  public async getDocumentById(id: string) {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundError("Asset document not found");
    }
    return document;
  }

  public async getDocumentsByAsset(assetId: string) {
    return this.repository.findByAsset(assetId);
  }
}
