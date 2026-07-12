import crypto from "crypto";
import { AssetRepository } from "../repository/asset.repository";
import { NotFoundError, ConflictError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AssetService {
  private repository = new AssetRepository();

  public async createAsset(data: any, currentUserId: string, companyId: string) {
    const category = await prisma.assetCategory.findFirst({
      where: { id: data.categoryId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundError("Asset category not found");
    }

    const office = await prisma.office.findFirst({
      where: { id: data.officeId, deletedAt: null },
    });
    if (!office) {
      throw new NotFoundError("Office not found");
    }

    if (data.assetTag) {
      const existing = await this.repository.findByAssetTag(companyId, data.assetTag);
      if (existing) {
        throw new ConflictError(`Asset tag "${data.assetTag}" already exists`);
      }
    } else {
      data.assetTag = `AST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      let existing = await this.repository.findByAssetTag(companyId, data.assetTag);
      while (existing) {
        data.assetTag = `AST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        existing = await this.repository.findByAssetTag(companyId, data.assetTag);
      }
    }

    if (data.barcode) {
      const existingBarcode = await this.repository.findByBarcode(data.barcode);
      if (existingBarcode) {
        throw new ConflictError(`Barcode "${data.barcode}" already exists`);
      }
    }

    data.companyId = companyId;
    const asset = await this.repository.create(data, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_CREATED",
      entityType: "Asset",
      entityId: asset.id,
      entityName: asset.name,
      newValue: asset,
    });

    return asset;
  }

  public async updateAsset(id: string, data: any, currentUserId: string, companyId: string) {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    if (data.assetTag && data.assetTag !== asset.assetTag) {
      const existing = await this.repository.findByAssetTag(companyId, data.assetTag);
      if (existing) {
        throw new ConflictError(`Asset tag "${data.assetTag}" already exists`);
      }
    }

    if (data.barcode && data.barcode !== asset.barcode) {
      const existingBarcode = await this.repository.findByBarcode(data.barcode);
      if (existingBarcode) {
        throw new ConflictError(`Barcode "${data.barcode}" already exists`);
      }
    }

    const oldStatus = asset.status;
    const updated = await this.repository.update(id, data, currentUserId);

    if (data.status && data.status !== oldStatus) {
      await prisma.assetStatusHistory.create({
        data: {
          assetId: id,
          oldStatus: oldStatus,
          newStatus: data.status,
          changedBy: currentUserId,
          reason: data.statusReason || "Status updated via asset update",
          notes: data.statusNotes || null,
        },
      });
    }

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_UPDATED",
      entityType: "Asset",
      entityId: id,
      entityName: updated.name,
      oldValue: asset,
      newValue: data,
    });

    return updated;
  }

  public async deleteAsset(id: string, currentUserId: string, companyId: string) {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    const allocations = await this.repository.findAllocations(id);
    if (allocations.length > 0) {
      throw new ConflictError("Cannot delete asset with active allocations");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_DELETED",
      entityType: "Asset",
      entityId: id,
      entityName: asset.name,
    });

    return { success: true };
  }

  public async getAssetById(id: string) {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }
    return asset;
  }

  public async getAssets(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const filters: any = {
      categoryId: query.categoryId,
      status: query.status,
      officeId: query.officeId,
      search: query.search,
    };

    const assets = await this.repository.findMany(companyId, filters);
    const total = assets.length;
    const start = (page - 1) * limit;
    const paginatedAssets = assets.slice(start, start + limit);

    return {
      data: paginatedAssets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async updateAssetStatus(id: string, status: string, reason: string, notes: string | null, currentUserId: string) {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    const oldStatus = asset.status;
    const updated = await this.repository.update(id, { status }, currentUserId);

    await prisma.assetStatusHistory.create({
      data: {
        assetId: id,
        previousStatus: oldStatus as any,
        newStatus: status as any,
        changedBy: currentUserId,
        reason: reason || "Status updated",
        notes: notes || null,
      },
    });

    await ActivityLogger.log({
      companyId: asset.companyId,
      userId: currentUserId,
      action: "ASSET_STATUS_UPDATED",
      entityType: "Asset",
      entityId: id,
      entityName: asset.name,
      oldValue: { status: oldStatus },
      newValue: { status },
    });

    return updated;
  }
}
