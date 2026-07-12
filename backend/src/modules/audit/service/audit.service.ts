import { prisma } from "../../../config/prisma";
import { AuditRepository } from "../repository/audit.repository";
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { cache } from "../../../utils/cache";
import {
  AUDIT_ENTITY_TYPE,
  NOTIFICATION_TYPES,
  ACTIVITY_ACTIONS,
  RESULT_STATUS_TO_DISCREPANCY,
  DISCREPANCY_TYPE_LOCATION_MISMATCH,
  DASHBOARD_CACHE_TTL,
  DASHBOARD_CACHE_PREFIX,
  RESULT_STATUS,
} from "../constants/audit.constants";
import { AuditStatus, AssetStatus, PriorityLevel } from "@prisma/client";

export class AuditService {
  private repository = new AuditRepository();

  public async createCycle(data: any, currentUserId: string, companyId: string) {
    const cycle = await this.repository.createCycle(
      {
        companyId,
        name: data.name,
        description: data.description || null,
        frequency: data.frequency,
        frequencyConfig: data.frequencyConfig || null,
        scope: data.scope || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextAuditDate: data.nextAuditDate ? new Date(data.nextAuditDate) : null,
        autoAssign: data.autoAssign !== undefined ? data.autoAssign : true,
        metadata: data.metadata || null,
      },
      currentUserId
    );

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.CYCLE_CREATED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: cycle.id,
      entityName: cycle.name,
      newValue: cycle,
    });

    return cycle;
  }

  public async listCycles(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters: any = {
      isActive: query.isActive !== undefined ? query.isActive === "true" : undefined,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };

    const cycles = await this.repository.findCycles(companyId, filters);
    const total = cycles.length;
    const start = (page - 1) * limit;
    const paginated = cycles.slice(start, start + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async searchCycles(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters: any = {
      name: query.name,
      description: query.description,
      isActive: query.isActive !== undefined ? query.isActive === "true" : undefined,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };

    const cycles = await this.repository.searchCycles(companyId, filters);
    const total = cycles.length;
    const start = (page - 1) * limit;
    const paginated = cycles.slice(start, start + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getCycle(id: string) {
    const cycle = await this.repository.findCycleById(id);
    if (!cycle) {
      throw new NotFoundError("Audit cycle not found");
    }
    return cycle;
  }

  public async updateCycle(id: string, data: any, currentUserId: string, companyId: string) {
    const existing = await this.repository.findCycleByIdRaw(id);
    if (!existing) {
      throw new NotFoundError("Audit cycle not found");
    }
    if (existing.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit cycle");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.frequencyConfig !== undefined) updateData.frequencyConfig = data.frequencyConfig;
    if (data.scope !== undefined) updateData.scope = data.scope;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.nextAuditDate !== undefined) updateData.nextAuditDate = data.nextAuditDate ? new Date(data.nextAuditDate) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.autoAssign !== undefined) updateData.autoAssign = data.autoAssign;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await this.repository.updateCycle(id, updateData, currentUserId);

    await cache.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}${id}`);

    return updated;
  }

  public async assignAuditor(cycleId: string, data: any, currentUserId: string, companyId: string) {
    const cycle = await this.repository.findCycleByIdRaw(cycleId);
    if (!cycle) {
      throw new NotFoundError("Audit cycle not found");
    }
    if (cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit cycle");
    }

    const user = await prisma.user.findFirst({
      where: { id: data.auditorId, companyId },
    });
    if (!user) {
      throw new NotFoundError("Auditor not found in your company");
    }

    const assignment = await this.repository.assignAuditor(
      {
        cycleId,
        auditorId: data.auditorId,
        officeId: data.officeId || null,
        departmentId: data.departmentId || null,
        scheduledDate: new Date(data.scheduledDate),
        assetCount: data.assetCount || null,
        notes: data.notes || null,
      },
      currentUserId
    );

    await NotificationTrigger.create({
      userId: data.auditorId,
      title: "Audit Assigned",
      message: `You have been assigned to the audit cycle "${cycle.name}". Scheduled for ${assignment.scheduledDate.toISOString()}.`,
      type: NOTIFICATION_TYPES.AUDIT_ASSIGNED,
      priority: PriorityLevel.MEDIUM,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: cycleId,
      actionUrl: `/audits/${cycleId}`,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.ASSIGNED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: cycleId,
      entityName: cycle.name,
      newValue: assignment,
    });

    return assignment;
  }

  public async startAudit(assignmentId: string, currentUserId: string, companyId: string) {
    const assignment = await this.repository.findAssignmentById(assignmentId);
    if (!assignment) {
      throw new NotFoundError("Audit assignment not found");
    }
    if (assignment.cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit assignment");
    }

    const now = new Date();
    const scheduled = new Date(assignment.scheduledDate);
    const windowStart = new Date(scheduled.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(scheduled.getTime() + 24 * 60 * 60 * 1000);
    if (now < windowStart || now > windowEnd) {
      throw new BadRequestError("Audit can only be started on or near the scheduled date");
    }

    if (assignment.status !== AuditStatus.SCHEDULED) {
      throw new ConflictError(`Audit assignment cannot be started from status ${assignment.status}`);
    }

    const updated = await this.repository.updateAssignment(
      assignmentId,
      { status: AuditStatus.IN_PROGRESS, startedAt: now },
      currentUserId
    );

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.STARTED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: assignment.cycleId,
      entityName: assignment.cycle.name,
      newValue: { assignmentId, status: AuditStatus.IN_PROGRESS },
    });

    return updated;
  }

  public async submitResult(assignmentId: string, data: any, currentUserId: string, companyId: string) {
    const assignment = await this.repository.findAssignmentById(assignmentId);
    if (!assignment) {
      throw new NotFoundError("Audit assignment not found");
    }
    if (assignment.cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit assignment");
    }

    const asset = await prisma.asset.findFirst({
      where: { id: data.assetId, companyId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundError("Asset not found in your company");
    }

    const result = await this.repository.upsertResult(
      { cycleId: assignment.cycleId, assetId: data.assetId },
      {
        assignmentId,
        status: data.status,
        condition: data.condition || null,
        locationMatch: data.locationMatch === undefined ? null : data.locationMatch,
        expectedLocation: data.expectedLocation || null,
        actualLocation: data.actualLocation || null,
        photos: data.photos || null,
        notes: data.notes || null,
        auditedAt: new Date(),
      },
      currentUserId
    );

    const shouldCreateDiscrepancy =
      [RESULT_STATUS.MISSING, RESULT_STATUS.DAMAGED, RESULT_STATUS.MISMATCH].includes(data.status) ||
      data.locationMatch === false;

    let discrepancy = null;
    if (shouldCreateDiscrepancy) {
      const discrepancyType = RESULT_STATUS_TO_DISCREPANCY[data.status] || DISCREPANCY_TYPE_LOCATION_MISMATCH;
      discrepancy = await this.repository.createDiscrepancy({
        resultId: result.id,
        discrepancyType,
        severity: PriorityLevel.MEDIUM,
        description:
          data.notes ||
          `Auto-generated discrepancy: ${discrepancyType} for asset ${asset.assetTag}`,
        expectedValue: data.expectedLocation ? { location: data.expectedLocation } : null,
        actualValue: data.actualLocation ? { location: data.actualLocation } : null,
        status: "OPEN",
        assignedTo: data.assignedTo || null,
      });

      await this.repository.updateAssignment(
        assignmentId,
        { discrepancyCount: { increment: 1 } },
        currentUserId
      );

      if (data.assignedTo) {
        await NotificationTrigger.create({
          userId: data.assignedTo,
          title: "Audit Discrepancy Assigned",
          message: `A discrepancy (${discrepancyType}) was found for asset ${asset.assetTag}.`,
          type: NOTIFICATION_TYPES.AUDIT_DISCREPANCY,
          priority: PriorityLevel.MEDIUM,
          entityType: AUDIT_ENTITY_TYPE,
          entityId: assignment.cycleId,
          actionUrl: `/audits/${assignment.cycleId}/discrepancies`,
        });
      }
    }

    await this.repository.updateAssignment(
      assignmentId,
      { auditedCount: { increment: 1 } },
      currentUserId
    );

    await cache.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}${assignment.cycleId}`);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.RESULT_SUBMITTED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: assignment.cycleId,
      entityName: asset.assetTag,
      newValue: { resultId: result.id, status: data.status, discrepancy: !!shouldCreateDiscrepancy },
    });

    return { result, discrepancy };
  }

  public async verifyResult(resultId: string, currentUserId: string, companyId: string) {
    const result = await this.repository.findResultById(resultId);
    if (!result) {
      throw new NotFoundError("Audit result not found");
    }
    if (result.cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit result");
    }

    const updated = await this.repository.updateResult(resultId, {
      status: RESULT_STATUS.VERIFIED,
      verifiedBy: currentUserId,
      verifiedAt: new Date(),
    });

    await cache.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}${result.cycleId}`);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.VERIFIED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: result.cycleId,
      entityName: result.asset?.assetTag,
      newValue: { resultId, status: RESULT_STATUS.VERIFIED, verifiedBy: currentUserId },
    });

    return updated;
  }

  public async markMissing(resultId: string, currentUserId: string, companyId: string) {
    const result = await this.repository.findResultById(resultId);
    if (!result) {
      throw new NotFoundError("Audit result not found");
    }
    if (result.cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit result");
    }

    const updated = await this.repository.updateResult(resultId, {
      status: RESULT_STATUS.MISSING,
    });

    const discrepancy = await this.repository.createDiscrepancy({
      resultId,
      discrepancyType: RESULT_STATUS_TO_DISCREPANCY[RESULT_STATUS.MISSING],
      severity: PriorityLevel.MEDIUM,
      description: `Asset ${result.asset?.assetTag || result.assetId} marked as missing during audit.`,
      status: "OPEN",
    });

    await this.repository.updateAssignment(
      result.assignmentId,
      { discrepancyCount: { increment: 1 }, auditedCount: { increment: 1 } },
      currentUserId
    );

    await this.repository.updateAssetStatus(result.assetId, AssetStatus.LOST);

    await cache.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}${result.cycleId}`);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.MISSING,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: result.cycleId,
      entityName: result.asset?.assetTag,
      newValue: { resultId, status: RESULT_STATUS.MISSING, assetStatus: AssetStatus.LOST },
    });

    return { result: updated, discrepancy };
  }

  public async markDamaged(resultId: string, currentUserId: string, companyId: string) {
    const result = await this.repository.findResultById(resultId);
    if (!result) {
      throw new NotFoundError("Audit result not found");
    }
    if (result.cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit result");
    }

    const updated = await this.repository.updateResult(resultId, {
      status: RESULT_STATUS.DAMAGED,
    });

    const discrepancy = await this.repository.createDiscrepancy({
      resultId,
      discrepancyType: RESULT_STATUS_TO_DISCREPANCY[RESULT_STATUS.DAMAGED],
      severity: PriorityLevel.MEDIUM,
      description: `Asset ${result.asset?.assetTag || result.assetId} marked as damaged during audit.`,
      status: "OPEN",
    });

    await this.repository.updateAssignment(
      result.assignmentId,
      { discrepancyCount: { increment: 1 }, auditedCount: { increment: 1 } },
      currentUserId
    );

    await this.repository.updateAssetStatus(result.assetId, AssetStatus.DAMAGED);

    await cache.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}${result.cycleId}`);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.DAMAGED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: result.cycleId,
      entityName: result.asset?.assetTag,
      newValue: { resultId, status: RESULT_STATUS.DAMAGED, assetStatus: AssetStatus.DAMAGED },
    });

    return { result: updated, discrepancy };
  }

  public async getDiscrepancyReport(cycleId: string) {
    const cycle = await this.repository.findCycleByIdRaw(cycleId);
    if (!cycle) {
      throw new NotFoundError("Audit cycle not found");
    }

    const discrepancies = await this.repository.findDiscrepanciesByCycle(cycleId);

    const rows = discrepancies.map((d) => ({
      assetTag: d.result?.asset?.assetTag || null,
      discrepancyType: d.discrepancyType,
      severity: d.severity,
      status: d.status,
      description: d.description,
      assignedTo: d.assignedTo || null,
    }));

    return { cycle, rows, total: rows.length };
  }

  public async closeAudit(cycleId: string, currentUserId: string, companyId: string) {
    const cycle = await this.repository.findCycleByIdRaw(cycleId);
    if (!cycle) {
      throw new NotFoundError("Audit cycle not found");
    }
    if (cycle.companyId !== companyId) {
      throw new ForbiddenError("You do not have access to this audit cycle");
    }
    if (!cycle.isActive) {
      throw new ConflictError("Audit cycle is already closed");
    }

    const assignments = await this.repository.findAssignmentsByCycle(cycleId);
    const results = await this.repository.findResultsByCycle(cycleId);

    await prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        await tx.auditAssignment.update({
          where: { id: assignment.id },
          data: { status: AuditStatus.CLOSED, completedAt: new Date() },
        });
      }

      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { endDate: new Date(), isActive: false, updatedBy: currentUserId },
      });

      for (const r of results) {
        if (r.status === RESULT_STATUS.MISSING) {
          await tx.asset.update({ where: { id: r.assetId }, data: { status: AssetStatus.LOST } });
        } else if (r.status === RESULT_STATUS.DAMAGED) {
          await tx.asset.update({ where: { id: r.assetId }, data: { status: AssetStatus.DAMAGED } });
        }
      }
    });

    const auditorIds = assignments.map((a) => a.auditorId);
    const uniqueAuditors = Array.from(new Set(auditorIds));
    for (const auditorId of uniqueAuditors) {
      await NotificationTrigger.create({
        userId: auditorId,
        title: "Audit Completed",
        message: `The audit cycle "${cycle.name}" has been closed.`,
        type: NOTIFICATION_TYPES.AUDIT_COMPLETED,
        priority: PriorityLevel.MEDIUM,
        entityType: AUDIT_ENTITY_TYPE,
        entityId: cycleId,
        actionUrl: `/audits/${cycleId}`,
      });
    }

    await cache.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}${cycleId}`);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.CLOSED,
      entityType: AUDIT_ENTITY_TYPE,
      entityId: cycleId,
      entityName: cycle.name,
      newValue: { assignmentsClosed: assignments.length, resultsProcessed: results.length },
    });

    return { cycleId, status: "CLOSED", assignmentsClosed: assignments.length };
  }

  public async getHistory(cycleId: string) {
    const cycle = await this.repository.findCycleByIdRaw(cycleId);
    if (!cycle) {
      throw new NotFoundError("Audit cycle not found");
    }
    return this.repository.getCycleHistory(cycleId);
  }

  public async getDashboard(cycleId: string) {
    const cacheKey = `${DASHBOARD_CACHE_PREFIX}${cycleId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const cycle = await this.repository.findCycleByIdRaw(cycleId);
    if (!cycle) {
      throw new NotFoundError("Audit cycle not found");
    }

    const data = await this.repository.getDashboardData(cycleId);
    await cache.set(cacheKey, data, DASHBOARD_CACHE_TTL);
    return data;
  }
}
