import { prisma } from "../../../config/prisma";
import { AuditStatus } from "@prisma/client";

export class AuditRepository {
  // ---- AuditCycle ----
  public async createCycle(data: any, createdBy?: string) {
    return prisma.auditCycle.create({
      data: {
        ...data,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  public async updateCycle(id: string, data: any, updatedBy?: string) {
    return prisma.auditCycle.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async findCycleById(id: string) {
    return prisma.auditCycle.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        assignments: {
          where: { deletedAt: null },
          include: {
            user: true,
          },
        },
        results: {
          include: {
            asset: true,
            discrepancies: true,
          },
        },
      },
    });
  }

  public async findCycleByIdRaw(id: string) {
    return prisma.auditCycle.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findCycles(companyId: string, filters: any) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (typeof filters.isActive === "boolean") {
      where.isActive = filters.isActive;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) where.startDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.startDate.lte = new Date(filters.dateTo);
    }

    return prisma.auditCycle.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { assignments: true, results: true },
        },
      },
    });
  }

  public async searchCycles(companyId: string, filters: any) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (filters.name) {
      where.name = { contains: filters.name, mode: "insensitive" };
    }
    if (filters.description) {
      where.description = { contains: filters.description, mode: "insensitive" };
    }
    if (typeof filters.isActive === "boolean") {
      where.isActive = filters.isActive;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) where.startDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.startDate.lte = new Date(filters.dateTo);
    }

    return prisma.auditCycle.findMany({
      where,
      orderBy: { startDate: "desc" },
    });
  }

  public async softDeleteCycle(id: string, updatedBy?: string) {
    return prisma.auditCycle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  // ---- AuditAssignment ----
  public async assignAuditor(data: any, createdBy?: string) {
    return prisma.auditAssignment.create({
      data: {
        ...data,
        createdBy,
        updatedBy: createdBy,
      },
      include: {
        user: true,
        cycle: true,
      },
    });
  }

  public async findAssignmentById(id: string) {
    return prisma.auditAssignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        cycle: true,
        results: true,
      },
    });
  }

  public async findAssignmentsByCycle(cycleId: string) {
    return prisma.auditAssignment.findMany({
      where: { cycleId, deletedAt: null },
      include: {
        user: true,
      },
    });
  }

  public async updateAssignment(id: string, data: any, updatedBy?: string) {
    return prisma.auditAssignment.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  // ---- AuditResult ----
  public async upsertResult(
    uniqueWhere: { cycleId: string; assetId: string },
    data: any,
    createdBy?: string
  ) {
    return prisma.auditResult.upsert({
      where: { cycleId_assetId: { cycleId: uniqueWhere.cycleId, assetId: uniqueWhere.assetId } },
      create: {
        ...data,
        cycleId: uniqueWhere.cycleId,
        assetId: uniqueWhere.assetId,
      },
      update: {
        ...data,
      },
    });
  }

  public async findResultById(id: string) {
    return prisma.auditResult.findUnique({
      where: { id },
      include: {
        assignment: true,
        cycle: true,
        asset: true,
        discrepancies: true,
      },
    });
  }

  public async findResultsByCycle(cycleId: string) {
    return prisma.auditResult.findMany({
      where: { cycleId },
      include: {
        asset: true,
        assignment: true,
      },
    });
  }

  public async updateResult(id: string, data: any) {
    return prisma.auditResult.update({
      where: { id },
      data,
    });
  }

  // ---- AuditDiscrepancy ----
  public async createDiscrepancy(data: any) {
    return prisma.auditDiscrepancy.create({
      data,
    });
  }

  public async findDiscrepanciesByCycle(cycleId: string) {
    return prisma.auditDiscrepancy.findMany({
      where: {
        result: {
          cycleId,
        },
      },
      include: {
        result: {
          include: {
            asset: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ---- Asset ----
  public async updateAssetStatus(
    assetId: string,
    status: any,
    condition?: any
  ) {
    const data: any = { status };
    if (condition) data.condition = condition;
    return prisma.asset.update({
      where: { id: assetId },
      data,
    });
  }

  // ---- Dashboard aggregation ----
  public async getDashboardData(cycleId: string) {
    const results = await prisma.auditResult.findMany({
      where: { cycleId },
      select: {
        status: true,
        assignmentId: true,
        assetId: true,
      },
    });

    const assignments = await prisma.auditAssignment.findMany({
      where: { cycleId, deletedAt: null },
      select: {
        id: true,
        auditorId: true,
        status: true,
        assetCount: true,
        auditedCount: true,
        discrepancyCount: true,
      },
    });

    const discrepancyCount = await prisma.auditDiscrepancy.count({
      where: {
        result: { cycleId },
      },
    });

    const totalAssetsAudited = results.length;
    const verifiedCount = results.filter((r) => r.status === "VERIFIED").length;
    const missingCount = results.filter((r) => r.status === "MISSING").length;
    const damagedCount = results.filter((r) => r.status === "DAMAGED").length;

    return {
      totalAssetsAudited,
      verifiedCount,
      missingCount,
      damagedCount,
      discrepancyCount,
      assignmentProgress: assignments.map((a) => ({
        assignmentId: a.id,
        auditorId: a.auditorId,
        status: a.status as AuditStatus,
        assetCount: a.assetCount,
        auditedCount: a.auditedCount,
        discrepancyCount: a.discrepancyCount,
      })),
    };
  }

  // ---- History ----
  public async getCycleHistory(cycleId: string) {
    const assignments = await prisma.auditAssignment.findMany({
      where: { cycleId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: true,
      },
    });

    const results = await prisma.auditResult.findMany({
      where: { cycleId },
      orderBy: { auditedAt: "asc" },
      include: {
        asset: true,
        discrepancies: true,
      },
    });

    return { assignments, results };
  }
}
