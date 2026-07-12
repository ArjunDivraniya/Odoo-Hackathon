import { TransferRepository } from "../repository/transfer.repository";
import { NotFoundError, ConflictError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class TransferService {
  private repository = new TransferRepository();

  public async createTransfer(data: any, currentUserId: string, companyId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, companyId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundError("Asset not found");
    }

    const fromOffice = await prisma.office.findFirst({
      where: { id: data.fromOfficeId, companyId, deletedAt: null },
    });
    if (!fromOffice) {
      throw new NotFoundError("Source office not found");
    }

    const toOffice = await prisma.office.findFirst({
      where: { id: data.toOfficeId, companyId, deletedAt: null },
    });
    if (!toOffice) {
      throw new NotFoundError("Destination office not found");
    }

    const pendingTransfer = await this.repository.findPendingByAsset(data.assetId);
    if (pendingTransfer) {
      throw new ConflictError("Asset already has a pending transfer request");
    }

    const transfer = await this.repository.create(
      {
        companyId,
        assetId: data.assetId,
        fromOfficeId: data.fromOfficeId,
        toOfficeId: data.toOfficeId,
        fromLocationId: data.fromLocationId || null,
        toLocationId: data.toLocationId || null,
        requestedBy: currentUserId,
        status: "REQUESTED",
        priority: data.priority || "MEDIUM",
        reason: data.reason || null,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes || null,
      },
      currentUserId
    );

    await prisma.asset.update({
      where: { id: data.assetId },
      data: { status: "TRANSFERRED" },
    });

    await this.repository.createHistory({
      transferId: transfer.id,
      action: "CREATED",
      newValues: transfer,
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "TRANSFER_CREATED",
      entityType: "TransferRequest",
      entityId: transfer.id,
      entityName: `Transfer for ${asset.name}`,
      newValue: transfer,
    });

    return transfer;
  }

  public async approveTransfer(id: string, data: any, currentUserId: string, companyId: string) {
    const transfer = await this.repository.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer not found");
    }

    if (transfer.status !== "REQUESTED") {
      throw new ConflictError("Transfer cannot be approved in its current status");
    }

    const oldValues = { status: transfer.status };
    let updateData: any = {};

    if (data.approved) {
      updateData = {
        status: "APPROVED",
        approvedBy: currentUserId,
        approvedAt: new Date(),
        shippingTracking: data.shippingTracking || null,
        shippingCarrier: data.shippingCarrier || null,
        shippingCost: data.shippingCost || null,
      };
    } else {
      updateData = {
        status: "REJECTED",
        approvedBy: currentUserId,
        approvedAt: new Date(),
        reason: data.rejectionReason || transfer.reason,
      };
    }

    const updated = await this.repository.update(id, updateData, currentUserId);

    await this.repository.createHistory({
      transferId: id,
      action: data.approved ? "APPROVED" : "REJECTED",
      oldValues,
      newValues: updateData,
      performedBy: currentUserId,
      notes: data.rejectionReason || null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: data.approved ? "TRANSFER_APPROVED" : "TRANSFER_REJECTED",
      entityType: "TransferRequest",
      entityId: id,
      entityName: `Transfer ${data.approved ? "approved" : "rejected"}`,
      oldValue: oldValues,
      newValue: updateData,
    });

    return updated;
  }

  public async receiveTransfer(id: string, data: any, currentUserId: string, companyId: string) {
    const transfer = await this.repository.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer not found");
    }

    if (!["IN_TRANSIT", "APPROVED"].includes(transfer.status)) {
      throw new ConflictError("Transfer cannot be received in its current status");
    }

    const oldValues = { status: transfer.status };

    const updated = await this.repository.update(
      id,
      {
        status: "COMPLETED",
        receivedBy: currentUserId,
        receivedAt: new Date(),
        conditionAfter: data.conditionAfter,
        notes: data.notes || transfer.notes,
        actualDate: new Date(),
      },
      currentUserId
    );

    await prisma.asset.update({
      where: { id: transfer.assetId },
      data: {
        officeId: transfer.toOfficeId,
        locationId: transfer.toLocationId || null,
        status: "AVAILABLE",
        condition: data.conditionAfter,
      },
    });

    await this.repository.createHistory({
      transferId: id,
      action: "COMPLETED",
      oldValues,
      newValues: { status: "COMPLETED", conditionAfter: data.conditionAfter },
      performedBy: currentUserId,
      notes: data.notes || null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "TRANSFER_COMPLETED",
      entityType: "TransferRequest",
      entityId: id,
      entityName: "Transfer completed",
      oldValue: oldValues,
      newValue: { status: "COMPLETED" },
    });

    return updated;
  }

  public async cancelTransfer(id: string, currentUserId: string, companyId: string) {
    const transfer = await this.repository.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer not found");
    }

    if (transfer.status === "COMPLETED") {
      throw new ConflictError("Cannot cancel a completed transfer");
    }

    const oldValues = { status: transfer.status };

    const updated = await this.repository.update(
      id,
      { status: "CANCELLED" },
      currentUserId
    );

    await prisma.asset.update({
      where: { id: transfer.assetId },
      data: { status: "AVAILABLE" },
    });

    await this.repository.createHistory({
      transferId: id,
      action: "CANCELLED",
      oldValues,
      newValues: { status: "CANCELLED" },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "TRANSFER_CANCELLED",
      entityType: "TransferRequest",
      entityId: id,
      entityName: "Transfer cancelled",
      oldValue: oldValues,
      newValue: { status: "CANCELLED" },
    });

    return updated;
  }

  public async getTransferById(id: string) {
    const transfer = await this.repository.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer not found");
    }
    return transfer;
  }

  public async getTransfers(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const filters: any = {
      status: query.status,
      assetId: query.assetId,
      fromOfficeId: query.fromOfficeId,
      toOfficeId: query.toOfficeId,
    };

    const transfers = await this.repository.findMany(companyId, filters);
    const total = transfers.length;
    const start = (page - 1) * limit;
    const paginatedTransfers = transfers.slice(start, start + limit);

    return {
      data: paginatedTransfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
