import { MaintenanceRepository } from "../repository/maintenance.repository";
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { prisma } from "../../../config/prisma";
import { MaintenanceStatus, PriorityLevel } from "@prisma/client";
import {
  ALLOWED_STATUS_TRANSITIONS,
  EDITABLE_STATUSES,
  MAINTENANCE_ACTIVITY_ACTIONS,
  MAINTENANCE_ENTITY_TYPE,
  MAINTENANCE_NOTIFICATION_TYPES,
} from "../constants/maintenance.constants";
import { MaintenanceListFilters, TimelineEntry } from "../types/maintenance.types";

export class MaintenanceService {
  private repository = new MaintenanceRepository();

  // 1. Create maintenance request
  public async createMaintenance(data: any, currentUserId: string, companyId: string) {
    const asset = await this.repository.getAssetById(data.assetId, companyId);
    if (!asset) {
      throw new NotFoundError("Asset not found in this company");
    }

    const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;

    const request = await this.repository.create(
      {
        companyId,
        assetId: data.assetId,
        requestedBy: currentUserId,
        title: data.title,
        description: data.description || null,
        status: MaintenanceStatus.REQUESTED,
        priority: data.priority || PriorityLevel.MEDIUM,
        type: data.type || "REPAIR",
        estimatedCost: data.estimatedCost ?? null,
        scheduledDate,
        notes: data.notes || null,
        vendorId: data.vendorId || null,
        externalRef: data.externalRef || null,
        metadata: data.metadata || null,
      },
      currentUserId
    );

    await this.repository.createStatusHistory({
      requestId: request.id,
      previousStatus: null,
      newStatus: MaintenanceStatus.REQUESTED,
      changedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.CREATED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: request.id,
      entityName: request.title,
      newValue: request,
    });

    return request;
  }

  // 2. List maintenance requests
  public async listMaintenance(companyId: string, filters: MaintenanceListFilters) {
    return this.repository.findMany(companyId, filters);
  }

  // 3. Get by id
  public async getMaintenanceById(id: string) {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    return request;
  }

  // 4. Update maintenance request
  public async updateMaintenance(id: string, data: any, currentUserId: string, companyId: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }
    if (!EDITABLE_STATUSES.includes(request.status)) {
      throw new ConflictError(
        `Maintenance request cannot be edited while in ${request.status} status`
      );
    }

    const payload: any = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.type !== undefined) payload.type = data.type;
    if (data.scheduledDate !== undefined) {
      payload.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
    }
    if (data.estimatedCost !== undefined) payload.estimatedCost = data.estimatedCost ?? null;
    if (data.notes !== undefined) payload.notes = data.notes;

    const oldValue = {
      title: request.title,
      description: request.description,
      priority: request.priority,
      type: request.type,
    };

    const updated = await this.repository.update(id, payload, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.UPDATED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      oldValue,
      newValue: payload,
    });

    return updated;
  }

  // 5. Approve maintenance
  public async approveMaintenance(id: string, currentUserId: string, companyId: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }
    if (request.status !== MaintenanceStatus.REQUESTED) {
      throw new ConflictError(
        `Maintenance request cannot be approved from ${request.status} status`
      );
    }

    const requestId = request.id;
    const assetId = request.assetId;
    const requesterId = request.requestedBy;
    const priority = request.priority;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.APPROVED,
          approvedBy: currentUserId,
          approvedAt: new Date(),
          updatedBy: currentUserId,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: "UNDER_MAINTENANCE" },
      });

      await tx.maintenanceStatusHistory.create({
        data: {
          requestId,
          previousStatus: MaintenanceStatus.REQUESTED,
          newStatus: MaintenanceStatus.APPROVED,
          changedBy: currentUserId,
        },
      });

      return updated;
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.APPROVED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      oldValue: { status: MaintenanceStatus.REQUESTED },
      newValue: { status: MaintenanceStatus.APPROVED },
    });

    await NotificationTrigger.create({
      userId: requesterId,
      title: "Maintenance Approved",
      message: `Your maintenance request "${request.title}" has been approved.`,
      type: MAINTENANCE_NOTIFICATION_TYPES.APPROVED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      priority: priority as PriorityLevel,
    });

    return result;
  }

  // 6. Reject maintenance
  public async rejectMaintenance(id: string, rejectionReason: string, currentUserId: string, companyId: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }
    if (request.status !== MaintenanceStatus.REQUESTED) {
      throw new ConflictError(
        `Maintenance request cannot be rejected from ${request.status} status`
      );
    }

    const updated = await this.repository.update(
      id,
      {
        status: MaintenanceStatus.REJECTED,
        rejectionReason,
        updatedBy: currentUserId,
      },
      currentUserId
    );

    await this.repository.createStatusHistory({
      requestId: id,
      previousStatus: MaintenanceStatus.REQUESTED,
      newStatus: MaintenanceStatus.REJECTED,
      reason: rejectionReason,
      changedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.REJECTED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      oldValue: { status: MaintenanceStatus.REQUESTED },
      newValue: { status: MaintenanceStatus.REJECTED, rejectionReason },
    });

    await NotificationTrigger.create({
      userId: request.requestedBy,
      title: "Maintenance Rejected",
      message: `Your maintenance request "${request.title}" was rejected. Reason: ${rejectionReason}`,
      type: MAINTENANCE_NOTIFICATION_TYPES.REJECTED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      priority: request.priority as PriorityLevel,
    });

    return updated;
  }

  // 7. Assign technician
  public async assignTechnician(
    id: string,
    data: { technicianId: string; role?: string; notes?: string },
    currentUserId: string,
    companyId: string
  ) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }

    const assignment = await this.repository.createTechnicianAssignment({
      requestId: id,
      technicianId: data.technicianId,
      assignedBy: currentUserId,
      role: data.role,
      notes: data.notes ?? null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.TECHNICIAN_ASSIGNED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      newValue: assignment,
    });

    await NotificationTrigger.create({
      userId: data.technicianId,
      title: "Maintenance Assignment",
      message: `You have been assigned to maintenance request "${request.title}".`,
      type: MAINTENANCE_NOTIFICATION_TYPES.TECHNICIAN_ASSIGNED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      priority: request.priority as PriorityLevel,
    });

    return assignment;
  }

  // 8. Update maintenance status
  public async updateStatus(
    id: string,
    newStatus: MaintenanceStatus,
    reason: string | undefined,
    currentUserId: string,
    companyId: string
  ) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[request.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Cannot transition maintenance from ${request.status} to ${newStatus}`
      );
    }

    const payload: any = { status: newStatus, updatedBy: currentUserId };
    if (newStatus === MaintenanceStatus.IN_PROGRESS) {
      payload.startedAt = new Date();
    }
    if (newStatus === MaintenanceStatus.COMPLETED) {
      payload.completedAt = new Date();
    }

    const updated = await this.repository.update(id, payload, currentUserId);

    await this.repository.createStatusHistory({
      requestId: id,
      previousStatus: request.status,
      newStatus,
      reason: reason ?? null,
      changedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.STATUS_UPDATED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      oldValue: { status: request.status },
      newValue: { status: newStatus },
    });

    return updated;
  }

  // 9. Complete maintenance
  public async completeMaintenance(
    id: string,
    data: { actualCost?: any; resolution?: string; downtimeHours?: any; rootCause?: string },
    currentUserId: string,
    companyId: string
  ) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }
    const allowed = ALLOWED_STATUS_TRANSITIONS[request.status] || [];
    if (!allowed.includes(MaintenanceStatus.COMPLETED)) {
      throw new ConflictError(
        `Maintenance request cannot be completed from ${request.status} status`
      );
    }

    const requestId = request.id;
    const assetId = request.assetId;
    const requesterId = request.requestedBy;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: MaintenanceStatus.COMPLETED,
          completedAt: new Date(),
          actualCost: data.actualCost ?? null,
          resolution: data.resolution ?? null,
          downtimeHours: data.downtimeHours ?? null,
          rootCause: data.rootCause ?? null,
          updatedBy: currentUserId,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: "AVAILABLE" },
      });

      await tx.maintenanceStatusHistory.create({
        data: {
          requestId,
          previousStatus: request.status,
          newStatus: MaintenanceStatus.COMPLETED,
          changedBy: currentUserId,
        },
      });

      return updated;
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.COMPLETED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      oldValue: { status: request.status },
      newValue: { status: MaintenanceStatus.COMPLETED },
    });

    await NotificationTrigger.create({
      userId: requesterId,
      title: "Maintenance Completed",
      message: `Your maintenance request "${request.title}" has been completed.`,
      type: MAINTENANCE_NOTIFICATION_TYPES.COMPLETED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      priority: request.priority as PriorityLevel,
    });

    return result;
  }

  // 10. Timeline
  public async getTimeline(id: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    const [statusHistory, technicians, attachments] = await Promise.all([
      this.repository.getStatusHistory(id),
      this.repository.getTechnicianAssignments(id),
      this.repository.getAttachments(id),
    ]);

    const entries: TimelineEntry[] = [];

    for (const h of statusHistory) {
      entries.push({
        id: h.id,
        eventType: "STATUS_CHANGE",
        timestamp: h.changedAt,
        title: `Status changed to ${h.newStatus}`,
        description: h.reason ?? null,
        metadata: { previousStatus: h.previousStatus, newStatus: h.newStatus, changedBy: h.changedBy },
      });
    }

    for (const t of technicians) {
      entries.push({
        id: t.id,
        eventType: "TECHNICIAN_ASSIGNED",
        timestamp: t.assignedAt,
        title: `Technician ${t.technicianId} assigned (${t.role})`,
        description: t.notes ?? null,
        metadata: { technicianId: t.technicianId, role: t.role, status: t.status },
      });
    }

    for (const a of attachments) {
      entries.push({
        id: a.id,
        eventType: "ATTACHMENT_ADDED",
        timestamp: a.createdAt,
        title: `Attachment added (${a.attachmentType})`,
        description: a.description ?? null,
        metadata: { fileId: a.fileId, attachmentType: a.attachmentType },
      });
    }

    entries.sort((x, y) => x.timestamp.getTime() - y.timestamp.getTime());

    return { requestId: id, timeline: entries };
  }

  // 11. Add attachment
  public async addAttachment(
    id: string,
    data: { fileId?: string | null; attachmentType?: string; description?: string },
    currentUserId: string,
    companyId: string
  ) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }

    const attachment = await this.repository.createAttachment({
      requestId: id,
      fileId: data.fileId ?? null,
      attachmentType: data.attachmentType,
      description: data.description,
      uploadedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: MAINTENANCE_ACTIVITY_ACTIONS.ATTACHMENT_ADDED,
      entityType: MAINTENANCE_ENTITY_TYPE,
      entityId: id,
      entityName: request.title,
      newValue: attachment,
    });

    return attachment;
  }

  // 12. List attachments
  public async listAttachments(id: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    return this.repository.getAttachments(id);
  }

  // 13. Soft delete attachment
  public async deleteAttachment(id: string, attachmentId: string, currentUserId: string, companyId: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    if (request.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this maintenance request");
    }

    const attachment = await this.repository.findAttachmentById(attachmentId, id);
    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    return this.repository.softDeleteAttachment(attachmentId);
  }

  // 14. History
  public async getHistory(id: string) {
    const request = await this.repository.findByIdForUpdate(id);
    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }
    return this.repository.getStatusHistory(id);
  }

  // 15. Search
  public async searchMaintenance(companyId: string, filters: MaintenanceListFilters) {
    return this.repository.search(companyId, filters);
  }

  // 16. Filter options
  public async getFilterOptions() {
    return {
      statuses: Object.values(MaintenanceStatus),
      priorities: Object.values(PriorityLevel),
    };
  }
}
