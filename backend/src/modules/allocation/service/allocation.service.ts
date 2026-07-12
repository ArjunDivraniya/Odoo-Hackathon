import { AllocationRepository } from "../repository/allocation.repository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AllocationService {
  private repository = new AllocationRepository();

  public async createAllocation(data: any, currentUserId: string, companyId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }
    if (asset.status !== "AVAILABLE") {
      throw new ConflictError(`Asset is not available for allocation (current status: ${asset.status})`);
    }

    const activeAllocation = await this.repository.findByAssetAndStatus(data.assetId, "ACTIVE");
    if (activeAllocation) {
      throw new ConflictError("Asset already has an active allocation");
    }

    const employee = await prisma.user.findFirst({
      where: { id: data.employeeId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    const allocation = await this.repository.create(
      {
        ...data,
        status: "PENDING",
        approvalStatus: "PENDING",
        allocatedBy: currentUserId,
        allocationDate: new Date(),
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      },
      currentUserId
    );

    await this.repository.createHistory({
      allocationId: allocation.id,
      action: "CREATED",
      newValues: allocation,
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ALLOCATION_CREATED",
      entityType: "AssetAllocation",
      entityId: allocation.id,
      entityName: `Allocation for ${asset.name}`,
      newValue: allocation,
    });

    return allocation;
  }

  public async approveAllocation(
    id: string,
    approved: boolean,
    rejectionReason: string | undefined,
    currentUserId: string,
    companyId: string
  ) {
    const allocation = await this.repository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    if (allocation.status !== "PENDING") {
      throw new BadRequestError("Can only approve pending allocations");
    }

    const updateData: any = {};

    if (approved) {
      updateData.approvalStatus = "APPROVED";
      updateData.status = "APPROVED";
      updateData.approvedBy = currentUserId;
      updateData.approvedAt = new Date();
    } else {
      updateData.approvalStatus = "REJECTED";
      updateData.status = "REJECTED";
      updateData.rejectionReason = rejectionReason;
    }

    const updated = await this.repository.update(id, updateData, currentUserId);

    await this.repository.createHistory({
      allocationId: id,
      action: approved ? "APPROVED" : "REJECTED",
      oldValues: { status: allocation.status, approvalStatus: allocation.approvalStatus },
      newValues: updateData,
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: approved ? "ALLOCATION_APPROVED" : "ALLOCATION_REJECTED",
      entityType: "AssetAllocation",
      entityId: id,
      entityName: `Allocation for asset ${allocation.assetId}`,
      oldValue: { status: allocation.status },
      newValue: updateData,
    });

    return updated;
  }

  public async activateAllocation(id: string, currentUserId: string, companyId: string) {
    const allocation = await this.repository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    if (allocation.approvalStatus !== "APPROVED" || allocation.status !== "APPROVED") {
      throw new BadRequestError("Can only activate approved allocations");
    }

    const updated = await this.repository.update(id, { status: "ACTIVE" }, currentUserId);

    await prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: "ALLOCATED" },
    });

    await this.repository.createHistory({
      allocationId: id,
      action: "ACTIVATED",
      oldValues: { status: "APPROVED" },
      newValues: { status: "ACTIVE" },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ALLOCATION_ACTIVATED",
      entityType: "AssetAllocation",
      entityId: id,
      entityName: `Allocation for asset ${allocation.assetId}`,
      newValue: { status: "ACTIVE" },
    });

    return updated;
  }

  public async cancelAllocation(id: string, currentUserId: string, companyId: string) {
    const allocation = await this.repository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    if (allocation.status === "ACTIVE") {
      throw new BadRequestError("Cannot cancel an active allocation. Use return instead.");
    }
    if (allocation.status === "CANCELLED") {
      throw new BadRequestError("Allocation is already cancelled");
    }

    const updated = await this.repository.update(id, { status: "CANCELLED" }, currentUserId);

    await this.repository.createHistory({
      allocationId: id,
      action: "CANCELLED",
      oldValues: { status: allocation.status },
      newValues: { status: "CANCELLED" },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ALLOCATION_CANCELLED",
      entityType: "AssetAllocation",
      entityId: id,
      entityName: `Allocation for asset ${allocation.assetId}`,
      oldValue: { status: allocation.status },
      newValue: { status: "CANCELLED" },
    });

    return updated;
  }

  public async updateAllocation(id: string, data: any, currentUserId: string, companyId: string) {
    const allocation = await this.repository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }

    const updateData: any = {};
    if (data.expectedReturnDate !== undefined) {
      updateData.expectedReturnDate = data.expectedReturnDate ? new Date(data.expectedReturnDate) : null;
    }
    if (data.purpose !== undefined) {
      updateData.purpose = data.purpose;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const updated = await this.repository.update(id, updateData, currentUserId);

    await this.repository.createHistory({
      allocationId: id,
      action: "UPDATED",
      oldValues: { purpose: allocation.purpose, notes: allocation.notes, expectedReturnDate: allocation.expectedReturnDate },
      newValues: updateData,
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ALLOCATION_UPDATED",
      entityType: "AssetAllocation",
      entityId: id,
      entityName: `Allocation for asset ${allocation.assetId}`,
      oldValue: { purpose: allocation.purpose, notes: allocation.notes },
      newValue: updateData,
    });

    return updated;
  }

  public async getAllocationById(id: string) {
    const allocation = await this.repository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found");
    }
    return allocation;
  }

  public async getAllocations(companyId: string, query: any) {
    return this.repository.findMany(companyId, query);
  }

  public async getAllocationsByEmployee(employeeId: string) {
    return this.repository.findActiveByEmployee(employeeId);
  }
}
