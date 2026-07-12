import { prisma } from "../../../config/prisma";

export class AnalyticsRepository {
  private inUseStatuses = ["ALLOCATED", "UNDER_MAINTENANCE", "RESERVED"];

  // ---------------------------------------------------------------------------
  // 1. ASSET UTILIZATION
  // ---------------------------------------------------------------------------

  public async getAssetUtilization(companyId: string) {
    const base: any = { companyId, deletedAt: null };

    const total = await prisma.asset.count({ where: base });
    const inUse = await prisma.asset.count({
      where: { ...base, status: { in: this.inUseStatuses } },
    });

    const overall = {
      total,
      inUse,
      available: total - inUse,
      utilization: total > 0 ? Number(((inUse / total) * 100).toFixed(2)) : 0,
    };

    const byDepartment = await prisma.department.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    const departmentStats = await Promise.all(
      byDepartment.map(async (dept: any) => {
        const t = await prisma.asset.count({
          where: { ...base, departmentId: dept.id },
        });
        const u = await prisma.asset.count({
          where: { ...base, departmentId: dept.id, status: { in: this.inUseStatuses } },
        });
        return {
          group: dept.name,
          total: t,
          inUse: u,
          available: t - u,
          utilization: t > 0 ? Number(((u / t) * 100).toFixed(2)) : 0,
        };
      })
    );

    const byCategory = await prisma.asset.groupBy({
      by: ["categoryId"],
      where: base,
      _count: { _all: true },
    });
    const categories = await prisma.assetCategory.findMany({
      where: { id: { in: byCategory.map((b: any) => b.categoryId) }, companyId, deletedAt: null },
    });
    const catMap = new Map(categories.map((c: any) => [c.id, c.name]));
    const categoryStats = await Promise.all(
      byCategory.map(async (b: any) => {
        const u = await prisma.asset.count({
          where: { ...base, categoryId: b.categoryId, status: { in: this.inUseStatuses } },
        });
        return {
          group: catMap.get(b.categoryId) || b.categoryId,
          total: b._count._all,
          inUse: u,
          available: b._count._all - u,
          utilization:
            b._count._all > 0 ? Number(((u / b._count._all) * 100).toFixed(2)) : 0,
        };
      })
    );

    return { overall, byDepartment: departmentStats, byCategory: categoryStats };
  }

  // ---------------------------------------------------------------------------
  // 2. MOST USED ASSETS
  // ---------------------------------------------------------------------------

  public async getMostUsedAssets(companyId: string) {
    const assets = await prisma.asset.findMany({
      where: { companyId, deletedAt: null },
      include: { category: true },
    });

    const assetIds = assets.map((a: any) => a.id);
    const allocCounts = await prisma.assetAllocation.groupBy({
      by: ["assetId"],
      where: { asset: { companyId, deletedAt: null }, deletedAt: null },
      _count: { _all: true },
    });
    const allocMap = new Map(allocCounts.map((a: any) => [a.assetId, a._count._all]));

    const resources = await prisma.sharedResource.findMany({
      where: { companyId, assetId: { in: assetIds.filter(Boolean) }, deletedAt: null },
      select: { id: true, assetId: true },
    });
    const resourceIds = resources.map((r: any) => r.id);
    const assetByResource = new Map(resources.map((r: any) => [r.id, r.assetId]));

    const bookingCounts = await prisma.resourceBooking.groupBy({
      by: ["resourceId"],
      where: { resourceId: { in: resourceIds }, deletedAt: null },
      _count: { _all: true },
    });
    const bookingMap = new Map<string, number>();
    for (const b of bookingCounts) {
      const assetId = assetByResource.get(b.resourceId);
      if (assetId) {
        bookingMap.set(assetId, (bookingMap.get(assetId) || 0) + b._count._all);
      }
    }

    const rows = assets
      .map((a: any) => {
        const allocationCount = allocMap.get(a.id) || 0;
        const bookingCount = bookingMap.get(a.id) || 0;
        return {
          assetId: a.id,
          assetTag: a.assetTag,
          name: a.name,
          categoryName: a.category?.name || null,
          allocationCount,
          bookingCount,
          usageScore: allocationCount * 2 + bookingCount,
        };
      })
      .sort((x: any, y: any) => y.usageScore - x.usageScore)
      .slice(0, 50);

    return rows;
  }

  // ---------------------------------------------------------------------------
  // 3. IDLE ASSETS
  // ---------------------------------------------------------------------------

  public async getIdleAssets(companyId: string, idleDays: number) {
    const now = new Date();
    const threshold = new Date(now.getTime() - idleDays * 24 * 60 * 60 * 1000);

    const assets = await prisma.asset.findMany({
      where: { companyId, deletedAt: null, status: "AVAILABLE" },
      include: { category: true, department: true },
    });

    const assetIds = assets.map((a: any) => a.id);
    const allocs = await prisma.assetAllocation.groupBy({
      by: ["assetId"],
      where: { assetId: { in: assetIds }, deletedAt: null },
      _max: { allocationDate: true },
    });
    const lastMap = new Map(allocs.map((a: any) => [a.assetId, a._max.allocationDate]));

    const rows = assets
      .filter((a: any) => {
        const last = lastMap.get(a.id);
        return !last || new Date(last) < threshold;
      })
      .map((a: any) => {
        const last = lastMap.get(a.id);
        const lastDate = last ? new Date(last) : null;
        const idle =
          lastDate !== null
            ? Math.floor((now.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
            : idleDays;
        return {
          assetId: a.id,
          assetTag: a.assetTag,
          name: a.name,
          categoryName: a.category?.name || null,
          departmentName: a.department?.name || null,
          lastAllocationDate: lastDate,
          idleDays: idle,
        };
      })
      .sort((x: any, y: any) => y.idleDays - x.idleDays);

    return rows;
  }

  // ---------------------------------------------------------------------------
  // 4. MAINTENANCE TRENDS
  // ---------------------------------------------------------------------------

  public async getMaintenanceTrends(companyId: string, from?: Date, to?: Date) {
    const where: any = { companyId, deletedAt: null };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) {
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: { createdAt: true, status: true },
    });

    const months: Record<string, any> = {};
    for (const r of requests) {
      const d = r.createdAt as Date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) {
        months[key] = { month: key, total: 0, requested: 0, inProgress: 0, completed: 0 };
      }
      months[key].total++;
      if (r.status === "REQUESTED") months[key].requested++;
      if (["IN_PROGRESS", "ON_HOLD", "APPROVED"].includes(r.status)) months[key].inProgress++;
      if (["COMPLETED", "VERIFIED"].includes(r.status)) months[key].completed++;
    }

    const rows = Object.values(months).sort((a: any, b: any) => a.month.localeCompare(b.month));
    return rows;
  }

  // ---------------------------------------------------------------------------
  // 5. DEPARTMENT ANALYTICS
  // ---------------------------------------------------------------------------

  public async getDepartmentAnalytics(companyId: string) {
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
          where: { companyId, departmentId: dept.id, deletedAt: null, status: "ALLOCATED" },
        });
        const availableAssets = await prisma.asset.count({
          where: { companyId, departmentId: dept.id, deletedAt: null, status: "AVAILABLE" },
        });
        const maintenanceRequests = await prisma.maintenanceRequest.count({
          where: { companyId, deletedAt: null, asset: { departmentId: dept.id, deletedAt: null } },
        });
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalAssets,
          allocatedAssets,
          availableAssets,
          maintenanceRequests,
          utilization:
            totalAssets > 0 ? Number(((allocatedAssets / totalAssets) * 100).toFixed(2)) : 0,
        };
      })
    );

    return rows;
  }

  // ---------------------------------------------------------------------------
  // 6. MONTHLY REPORT
  // ---------------------------------------------------------------------------

  public async getMonthlyReport(companyId: string, year: number) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const [assets, maintenance, assignments, bookings] = await Promise.all([
      prisma.asset.findMany({
        where: { companyId, deletedAt: null, createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: { companyId, deletedAt: null, createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }),
      prisma.auditAssignment.findMany({
        where: { cycle: { companyId, deletedAt: null }, scheduledDate: { gte: start, lt: end } },
        select: { scheduledDate: true },
      }),
      prisma.resourceBooking.findMany({
        where: {
          resource: { companyId, deletedAt: null },
          deletedAt: null,
          startTime: { gte: start, lt: end },
        },
        select: { startTime: true },
      }),
    ]);

    const buckets: Record<string, any> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      buckets[key] = {
        month: key,
        assetsAdded: 0,
        maintenanceRequests: 0,
        audits: 0,
        bookings: 0,
      };
    }
    const bucket = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    assets.forEach((a: any) => buckets[bucket(a.createdAt)].assetsAdded++);
    maintenance.forEach((m: any) => buckets[bucket(m.createdAt)].maintenanceRequests++);
    assignments.forEach((a: any) => buckets[bucket(a.scheduledDate)].audits++);
    bookings.forEach((b: any) => buckets[bucket(b.startTime)].bookings++);

    return Object.values(buckets);
  }

  // ---------------------------------------------------------------------------
  // 7. YEARLY REPORT
  // ---------------------------------------------------------------------------

  public async getYearlyReport(companyId: string) {
    const [assets, maintenance, assignments, bookings] = await Promise.all([
      prisma.asset.findMany({
        where: { companyId, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: { companyId, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.auditAssignment.findMany({
        where: { cycle: { companyId, deletedAt: null } },
        select: { scheduledDate: true },
      }),
      prisma.resourceBooking.findMany({
        where: { resource: { companyId, deletedAt: null }, deletedAt: null },
        select: { startTime: true },
      }),
    ]);

    const buckets: Record<string, any> = {};
    const bucket = (d: Date) => String(d.getUTCFullYear());
    assets.forEach((a: any) => {
      const y = bucket(a.createdAt);
      buckets[y] = buckets[y] || { year: y, assetsAdded: 0, maintenanceRequests: 0, audits: 0, bookings: 0 };
      buckets[y].assetsAdded++;
    });
    maintenance.forEach((m: any) => {
      const y = bucket(m.createdAt);
      buckets[y] = buckets[y] || { year: y, assetsAdded: 0, maintenanceRequests: 0, audits: 0, bookings: 0 };
      buckets[y].maintenanceRequests++;
    });
    assignments.forEach((a: any) => {
      const y = bucket(a.scheduledDate);
      buckets[y] = buckets[y] || { year: y, assetsAdded: 0, maintenanceRequests: 0, audits: 0, bookings: 0 };
      buckets[y].audits++;
    });
    bookings.forEach((b: any) => {
      const y = bucket(b.startTime);
      buckets[y] = buckets[y] || { year: y, assetsAdded: 0, maintenanceRequests: 0, audits: 0, bookings: 0 };
      buckets[y].bookings++;
    });

    return Object.values(buckets).sort((a: any, b: any) => a.year.localeCompare(b.year));
  }

  // ---------------------------------------------------------------------------
  // 8. CUSTOM ANALYTICS (dynamic groupBy)
  // ---------------------------------------------------------------------------

  public async getCustomAnalytics(companyId: string, query: any) {
    const fieldMap: Record<string, string> = {
      status: "status",
      condition: "condition",
      category: "categoryId",
      department: "departmentId",
      office: "officeId",
      priority: "priority",
      type: "type",
    };

    const prismaField = fieldMap[query.groupBy];
    if (!prismaField) {
      throw new Error(`Unsupported groupBy: ${query.groupBy}`);
    }

    const where: any = { companyId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const d = new Date(query.dateTo);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    if (query.groupBy === "category") {
      const grouped = await prisma.asset.groupBy({
        by: ["categoryId"],
        where,
        _count: { _all: true },
      });
      const categories = await prisma.assetCategory.findMany({
        where: { id: { in: grouped.map((g: any) => g.categoryId) }, companyId, deletedAt: null },
      });
      const catMap = new Map(categories.map((c: any) => [c.id, c.name]));
      return grouped.map((g: any) => ({
        key: catMap.get(g.categoryId) || g.categoryId,
        count: g._count._all,
      }));
    }

    if (query.groupBy === "department") {
      const grouped = await prisma.asset.groupBy({
        by: ["departmentId"],
        where,
        _count: { _all: true },
      });
      const depts = await prisma.department.findMany({
        where: { id: { in: grouped.map((g: any) => g.departmentId).filter(Boolean) }, companyId, deletedAt: null },
      });
      const deptMap = new Map(depts.map((d: any) => [d.id, d.name]));
      return grouped.map((g: any) => ({
        key: g.departmentId ? deptMap.get(g.departmentId) || g.departmentId : "UNASSIGNED",
        count: g._count._all,
      }));
    }

    if (query.groupBy === "office") {
      const grouped = await prisma.asset.groupBy({
        by: ["officeId"],
        where,
        _count: { _all: true },
      });
      const offices = await prisma.office.findMany({
        where: { id: { in: grouped.map((g: any) => g.officeId).filter(Boolean) }, companyId },
      });
      const officeMap = new Map(offices.map((o: any) => [o.id, o.name]));
      return grouped.map((g: any) => ({
        key: g.officeId ? officeMap.get(g.officeId) || g.officeId : "UNASSIGNED",
        count: g._count._all,
      }));
    }

    const grouped = await prisma.asset.groupBy({
      by: [prismaField as any],
      where,
      _count: { _all: true },
    });
    return grouped.map((g: any) => ({
      key: g[prismaField],
      count: g._count._all,
    }));
  }
}
