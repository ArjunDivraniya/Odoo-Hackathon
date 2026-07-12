import { prisma } from "../../../config/prisma";
import { ReportFilter, ReportDataSource } from "../types/reports.types";

export class ReportsRepository {
  // ---------------------------------------------------------------------------
  // Shared filter helpers
  // ---------------------------------------------------------------------------

  private buildDateRange(dateFrom?: string, dateTo?: string): any {
    const range: any = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    return Object.keys(range).length ? range : undefined;
  }

  private assetWhere(companyId: string, filters: ReportFilter): any {
    const where: any = { companyId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.officeId) where.officeId = filters.officeId;
    if (filters.condition) where.condition = filters.condition;
    const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
    if (range) where.createdAt = range;
    return where;
  }

  private maintenanceWhere(companyId: string, filters: ReportFilter): any {
    const where: any = { companyId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
    if (range) where.createdAt = range;
    return where;
  }

  // ---------------------------------------------------------------------------
  // 1. ASSET REPORT
  // ---------------------------------------------------------------------------

  public async getAssetReport(companyId: string, filters: ReportFilter) {
    const where = this.assetWhere(companyId, filters);

    const assets = await prisma.asset.findMany({
      where,
      include: { category: true, department: true, office: true },
      orderBy: { createdAt: "desc" },
    });

    const rows = assets.map((a: any) => ({
      id: a.id,
      assetTag: a.assetTag,
      name: a.name,
      status: a.status,
      condition: a.condition,
      categoryName: a.category?.name || null,
      departmentName: a.department?.name || null,
      officeName: a.office?.name || null,
      purchaseDate: a.purchaseDate,
      currentValue: a.currentValue,
    }));

    const byStatus = await prisma.asset.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });
    const byCondition = await prisma.asset.groupBy({
      by: ["condition"],
      where,
      _count: { _all: true },
    });

    const summary = {
      total: rows.length,
      byStatus: byStatus.reduce((acc: any, s: any) => {
        acc[s.status] = s._count._all;
        return acc;
      }, {}),
      byCondition: byCondition.reduce((acc: any, s: any) => {
        acc[s.condition] = s._count._all;
        return acc;
      }, {}),
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 2. MAINTENANCE REPORT
  // ---------------------------------------------------------------------------

  public async getMaintenanceReport(companyId: string, filters: ReportFilter) {
    const where = this.maintenanceWhere(companyId, filters);

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: { asset: true },
      orderBy: { createdAt: "desc" },
    });

    const rows = requests.map((r: any) => ({
      id: r.id,
      reference: r.id.slice(0, 8).toUpperCase(),
      title: r.title,
      assetTag: r.asset?.assetTag || null,
      status: r.status,
      priority: r.priority,
      type: r.type,
      requestedAt: r.createdAt,
      completedAt: r.completedAt,
      estimatedCost: r.estimatedCost,
      actualCost: r.actualCost,
    }));

    const byStatus = await prisma.maintenanceRequest.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });
    const byPriority = await prisma.maintenanceRequest.groupBy({
      by: ["priority"],
      where,
      _count: { _all: true },
    });

    const byMonth: Record<string, number> = {};
    for (const r of requests) {
      const month = (r.createdAt as Date).toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    const summary = {
      total: rows.length,
      byStatus: byStatus.reduce((acc: any, s: any) => {
        acc[s.status] = s._count._all;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc: any, s: any) => {
        acc[s.priority] = s._count._all;
        return acc;
      }, {}),
      byMonth,
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 3. AUDIT REPORT
  // ---------------------------------------------------------------------------

  public async getAuditReport(companyId: string, filters: ReportFilter) {
    const cycleWhere: any = { companyId, deletedAt: null };
    if (filters.status && filters.status !== "ALL") {
      // status on cycle not available; filter via assignment status when relevant
    }

    const cycles = await prisma.auditCycle.findMany({
      where: cycleWhere,
      include: {
        assignments: {
          where: filters.status ? { status: filters.status as any } : undefined,
          include: {
            user: true,
            results: { include: { discrepancies: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const rows: any[] = [];
    let totalAssignments = 0;
    let totalResults = 0;
    let totalDiscrepancies = 0;
    const discrepancyByType: Record<string, number> = {};

    for (const cycle of cycles) {
      for (const assignment of cycle.assignments) {
        totalAssignments++;
        let resultCount = 0;
        let discCount = 0;
        for (const result of assignment.results) {
          resultCount++;
          totalResults++;
          for (const disc of result.discrepancies) {
            discCount++;
            totalDiscrepancies++;
            discrepancyByType[disc.discrepancyType] =
              (discrepancyByType[disc.discrepancyType] || 0) + 1;
          }
        }
        rows.push({
          cycleId: cycle.id,
          cycleName: cycle.name,
          assignmentAuditor: assignment.user
            ? `${assignment.user.firstName} ${assignment.user.lastName}`
            : null,
          status: assignment.status,
          assetCount: assignment.assetCount || 0,
          auditedCount: assignment.auditedCount,
          discrepancyCount: discCount,
          completedAt: assignment.completedAt,
        });
      }
    }

    const summary = {
      totalCycles: cycles.length,
      totalAssignments,
      totalResults,
      totalDiscrepancies,
      discrepancyByType,
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 4. DEPARTMENT REPORT
  // ---------------------------------------------------------------------------

  public async getDepartmentReport(companyId: string, filters: ReportFilter) {
    const departments = await prisma.department.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
    });

    const rows = await Promise.all(
      departments.map(async (dept: any) => {
        const totalAssets = await prisma.asset.count({
          where: { companyId, departmentId: dept.id, deletedAt: null },
        });
        const allocatedAssets = await prisma.asset.count({
          where: {
            companyId,
            departmentId: dept.id,
            deletedAt: null,
            status: "ALLOCATED",
          },
        });
        const availableAssets = await prisma.asset.count({
          where: {
            companyId,
            departmentId: dept.id,
            deletedAt: null,
            status: "AVAILABLE",
          },
        });
        const maintenanceRequests = await prisma.maintenanceRequest.count({
          where: {
            companyId,
            deletedAt: null,
            asset: { departmentId: dept.id, deletedAt: null },
          },
        });
        const utilization =
          totalAssets > 0
            ? Number(((allocatedAssets / totalAssets) * 100).toFixed(2))
            : 0;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalAssets,
          allocatedAssets,
          availableAssets,
          maintenanceRequests,
          utilization,
        };
      })
    );

    const summary = {
      totalDepartments: rows.length,
      totalAssets: rows.reduce((a: number, d: any) => a + d.totalAssets, 0),
      totalAllocated: rows.reduce((a: number, d: any) => a + d.allocatedAssets, 0),
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 5. EMPLOYEE REPORT
  // ---------------------------------------------------------------------------

  public async getEmployeeReport(companyId: string, filters: ReportFilter) {
    const employeeWhere: any = { companyId, deletedAt: null };
    if (filters.departmentId) employeeWhere.departmentId = filters.departmentId;

    const employees = await prisma.employeeProfile.findMany({
      where: employeeWhere,
      include: { user: true, department: true },
      orderBy: { createdAt: "asc" },
    });

    const rows = await Promise.all(
      employees.map(async (emp: any) => {
        const allocations = await prisma.assetAllocation.findMany({
          where: { employeeId: emp.userId, deletedAt: null },
          include: { asset: true },
        });
        const activeAllocations = allocations.filter(
          (a: any) => a.status === "ACTIVE"
        ).length;
        return {
          employeeId: emp.employeeId,
          employeeName: emp.user
            ? `${emp.user.firstName} ${emp.user.lastName}`
            : emp.employeeId,
          departmentName: emp.department?.name || null,
          status: emp.status,
          allocatedAssets: allocations.length,
          activeAllocations,
        };
      })
    );

    const summary = {
      totalEmployees: rows.length,
      totalAllocations: rows.reduce((a: number, e: any) => a + e.allocatedAssets, 0),
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 6. ALLOCATION REPORT
  // ---------------------------------------------------------------------------

  public async getAllocationReport(companyId: string, filters: ReportFilter) {
    const where: any = {
      deletedAt: null,
      asset: { companyId, deletedAt: null },
    };
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.asset.departmentId = filters.departmentId;

    const allocations = await prisma.assetAllocation.findMany({
      where,
      include: { asset: true, user: true },
      orderBy: { allocationDate: "desc" },
    });

    const now = new Date();
    const rows = allocations.map((a: any) => {
      const isOverdue =
        a.status === "ACTIVE" &&
        a.expectedReturnDate &&
        new Date(a.expectedReturnDate) < now;
      return {
        id: a.id,
        assetTag: a.asset?.assetTag || null,
        assetName: a.asset?.name || null,
        employeeName: a.user
          ? `${a.user.firstName} ${a.user.lastName}`
          : null,
        status: a.status,
        allocationDate: a.allocationDate,
        expectedReturnDate: a.expectedReturnDate,
        isOverdue,
      };
    });

    const byStatus = await prisma.assetAllocation.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });
    const overdue = rows.filter((r: any) => r.isOverdue).length;

    const summary = {
      total: rows.length,
      byStatus: byStatus.reduce((acc: any, s: any) => {
        acc[s.status] = s._count._all;
        return acc;
      }, {}),
      overdue,
      active: rows.filter((r: any) => r.status === "ACTIVE").length,
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 7. UTILIZATION REPORT
  // ---------------------------------------------------------------------------

  public async getUtilizationReport(companyId: string, filters: ReportFilter) {
    const assetWhere: any = { companyId, deletedAt: null };
    if (filters.categoryId) assetWhere.categoryId = filters.categoryId;
    if (filters.departmentId) assetWhere.departmentId = filters.departmentId;

    const inUseStatuses = ["ALLOCATED", "UNDER_MAINTENANCE", "RESERVED"];
    const total = await prisma.asset.count({ where: assetWhere });
    const inUse = await prisma.asset.count({
      where: { ...assetWhere, status: { in: inUseStatuses } },
    });

    const overall = {
      group: "OVERALL",
      total,
      inUse,
      available: total - inUse,
      utilization: total > 0 ? Number(((inUse / total) * 100).toFixed(2)) : 0,
    };

    let breakdown: any[] = [];
    if (filters.categoryId) {
      const cat = await prisma.assetCategory.findFirst({
        where: { id: filters.categoryId, companyId, deletedAt: null },
      });
      breakdown = [
        {
          group: cat?.name || filters.categoryId,
          total,
          inUse,
          available: total - inUse,
          utilization: overall.utilization,
        },
      ];
    } else if (filters.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: filters.departmentId, companyId, deletedAt: null },
      });
      breakdown = [
        {
          group: dept?.name || filters.departmentId,
          total,
          inUse,
          available: total - inUse,
          utilization: overall.utilization,
        },
      ];
    } else {
      const byCategory = await prisma.asset.groupBy({
        by: ["categoryId"],
        where: assetWhere,
        _count: { _all: true },
      });
      const categories = await prisma.assetCategory.findMany({
        where: {
          id: { in: byCategory.map((b: any) => b.categoryId) },
          companyId,
          deletedAt: null,
        },
      });
      const catMap = new Map(categories.map((c: any) => [c.id, c.name]));
      breakdown = await Promise.all(
        byCategory.map(async (b: any) => {
          const inUseCat = await prisma.asset.count({
            where: {
              ...assetWhere,
              categoryId: b.categoryId,
              status: { in: inUseStatuses },
            },
          });
          return {
            group: catMap.get(b.categoryId) || b.categoryId,
            total: b._count._all,
            inUse: inUseCat,
            available: b._count._all - inUseCat,
            utilization:
              b._count._all > 0
                ? Number(((inUseCat / b._count._all) * 100).toFixed(2))
                : 0,
          };
        })
      );
    }

    const rows = [overall, ...breakdown];
    const summary = overall;
    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // 8. BOOKING REPORT
  // ---------------------------------------------------------------------------

  public async getBookingReport(companyId: string, filters: ReportFilter) {
    const where: any = {
      deletedAt: null,
      resource: { companyId, deletedAt: null },
    };
    if (filters.status) where.status = filters.status as any;
    const range = this.buildDateRange(filters.dateFrom, filters.dateTo);
    if (range) where.startTime = range;

    const bookings = await prisma.resourceBooking.findMany({
      where,
      include: { resource: true, bookedByUser: true },
      orderBy: { startTime: "desc" },
    });

    const rows = bookings.map((b: any) => ({
      id: b.id,
      title: b.title,
      resourceName: b.resource?.name || null,
      bookedBy: b.bookedByUser
        ? `${b.bookedByUser.firstName} ${b.bookedByUser.lastName}`
        : null,
      status: b.status,
      startTime: b.startTime,
      endTime: b.endTime,
      attendeeCount: b.attendeeCount,
    }));

    const byStatus = await prisma.resourceBooking.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const totalDurationHours = bookings.reduce((acc: number, b: any) => {
      const ms =
        new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
      return acc + (ms > 0 ? ms / 3_600_000 : 0);
    }, 0);

    const summary = {
      total: rows.length,
      byStatus: byStatus.reduce((acc: any, s: any) => {
        acc[s.status] = s._count._all;
        return acc;
      }, {}),
      totalBookedHours: Number(totalDurationHours.toFixed(2)),
    };

    return { rows, summary };
  }

  // ---------------------------------------------------------------------------
  // Generic builder dispatch (reused by generate + export endpoints)
  // ---------------------------------------------------------------------------

  public async buildDataSource(
    dataSource: ReportDataSource,
    companyId: string,
    filters: ReportFilter
  ) {
    switch (dataSource) {
      case "asset":
        return this.getAssetReport(companyId, filters);
      case "maintenance":
        return this.getMaintenanceReport(companyId, filters);
      case "audit":
        return this.getAuditReport(companyId, filters);
      case "department":
        return this.getDepartmentReport(companyId, filters);
      case "employee":
        return this.getEmployeeReport(companyId, filters);
      case "allocation":
        return this.getAllocationReport(companyId, filters);
      case "utilization":
        return this.getUtilizationReport(companyId, filters);
      case "booking":
        return this.getBookingReport(companyId, filters);
      default:
        throw new Error(`Unsupported data source: ${dataSource}`);
    }
  }

  // ---------------------------------------------------------------------------
  // ReportMetadata (saved definitions) CRUD
  // ---------------------------------------------------------------------------

  public async createMetadata(data: any, createdBy: string) {
    return prisma.reportMetadata.create({
      data: { ...data, createdBy },
    });
  }

  public async listMetadata(companyId: string, query: any) {
    const where: any = { companyId, deletedAt: null };
    if (query.category) where.category = query.category;
    if (query.reportType) where.reportType = query.reportType;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.reportMetadata.count({ where });
    const items = await prisma.reportMetadata.findMany({
      where,
      include: { creator: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      data: items,
      pagination: {
        total,
        count: items.length,
      },
    };
  }

  public async getMetadataById(id: string) {
    return prisma.reportMetadata.findFirst({
      where: { id, deletedAt: null },
      include: { creator: true },
    });
  }

  public async updateMetadata(id: string, data: any) {
    return prisma.reportMetadata.update({
      where: { id },
      data,
    });
  }

  public async softDeleteMetadata(id: string) {
    return prisma.reportMetadata.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async getMetadataForGenerate(id: string, companyId: string) {
    return prisma.reportMetadata.findFirst({
      where: { id, companyId, deletedAt: null },
    });
  }

  public async markGenerated(id: string, tx?: any) {
    const client = tx || prisma;
    return client.reportMetadata.update({
      where: { id },
      data: { lastGeneratedAt: new Date() },
    });
  }
}
