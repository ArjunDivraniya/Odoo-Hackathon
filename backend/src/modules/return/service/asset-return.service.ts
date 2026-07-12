import { AssetReturnRepository } from "../repository/asset-return.repository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AssetReturnService {
  private repository = new AssetReturnRepository();

  public async createReturn(data: any, currentUserId: string, companyId: string) {
    const allocation = await prisma.assetAllocation.findFirst({
      where: { id: data.allocationId, deletedAt: null },
    });
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    if (allocation.status !== "ACTIVE") {
      throw new BadRequestError("Can only return assets from active allocations");
    }

    const existingReturn = await this.repository.findByAllocationId(data.allocationId);
    if (existingReturn) {
      throw new ConflictError("A return record already exists for this allocation");
    }

    const asset = await prisma.asset.findFirst({
      where: { id: allocation.assetId, deletedAt: null },
    });

    const returnRecord = await this.repository.create({
      allocationId: data.allocationId,
      assetId: allocation.assetId,
      returnedBy: currentUserId,
      condition: data.condition,
      damageReport: data.damageReport || null,
      missingItems: data.missingItems || null,
      notes: data.notes || null,
      requiresRepair: data.requiresRepair || false,
      photos: data.photos || null,
      status: "PENDING",
    });

    await prisma.assetAllocation.update({
      where: { id: data.allocationId },
      data: {
        status: "RETURNED",
        actualReturnDate: new Date(),
        returnCondition: data.condition,
        returnNotes: data.notes || null,
        returnVerifiedBy: null,
      },
    });

    const AllocationRepositoryClass = (await import("../../allocation/repository/allocation.repository")).AllocationRepository;
    const allocationRepo = new AllocationRepositoryClass();
    await allocationRepo.createHistory({
      allocationId: data.allocationId,
      action: "RETURNED",
      newValues: { returnCondition: data.condition, returnNotes: data.notes },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_RETURNED",
      entityType: "AssetReturn",
      entityId: returnRecord.id,
      entityName: `Return for ${asset?.name || allocation.assetId}`,
      newValue: returnRecord,
    });

    return returnRecord;
  }

  public async verifyReturn(id: string, verified: boolean, notes: string | undefined, currentUserId: string, companyId: string) {
    const returnRecord = await this.repository.findById(id);
    if (!returnRecord) {
      throw new NotFoundError("Return record not found");
    }
    if (returnRecord.status !== "PENDING") {
      throw new BadRequestError("Can only verify pending returns");
    }

    const updateData: any = {};

    if (verified) {
      updateData.status = "VERIFIED";
      updateData.verifiedBy = currentUserId;
    } else {
      updateData.status = "REJECTED";
      updateData.notes = notes;
    }

    const updated = await this.repository.update(id, updateData);

    if (verified) {
      const newStatus = returnRecord.requiresRepair ? "UNDER_MAINTENANCE" : "AVAILABLE";
      await prisma.asset.update({
        where: { id: returnRecord.assetId },
        data: {
          status: newStatus as any,
        },
      });

      await prisma.assetAllocation.update({
        where: { id: returnRecord.allocationId },
        data: {
          returnVerifiedBy: currentUserId,
        },
      });
    }

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: verified ? "RETURN_VERIFIED" : "RETURN_REJECTED",
      entityType: "AssetReturn",
      entityId: id,
      entityName: `Return for asset ${returnRecord.assetId}`,
      newValue: updateData,
    });

    return updated;
  }

  public async getReturnById(id: string) {
    const returnRecord = await this.repository.findById(id);
    if (!returnRecord) {
      throw new NotFoundError("Return record not found");
    }
    return returnRecord;
  }

  public async getReturns(companyId: string, query: any) {
    return this.repository.findMany(companyId, query);
  }
}
