import { prisma } from "../../../config/prisma";
import {
  AssetStatus,
  MaintenanceStatus,
  AuditStatus,
  BookingStatus,
} from "@prisma/client";

const MAINTENANCE_OPEN_STATUSES = [
  MaintenanceStatus.REQUESTED,
  MaintenanceStatus.APPROVED,
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.ON_HOLD,
];

export class DashboardRepository {
  public async getSummary(companyId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [
      totalAssets,
      availableAssets,
      underMaintenance,
      totalMaintenanceOpen,
      totalAuditsActive,
      totalBookingsToday,
      totalEmployees,
      totalDepartments,
    ] = await prisma.$transaction([
      prisma.asset.count({ where: { companyId, deletedAt: null } }),
      prisma.asset.count({
        where: { companyId, deletedAt: null, status: AssetStatus.AVAILABLE },
      }),
      prisma.asset.count({
        where: { companyId, deletedAt: null, status: AssetStatus.UNDER_MAINTENANCE },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, status: { in: MAINTENANCE_OPEN_STATUSES } },
      }),
      prisma.auditCycle.count({
        where: { companyId, isActive: true, deletedAt: null },
      }),
      prisma.resourceBooking.count({
        where: {
          resource: { companyId, deletedAt: null },
          startTime: { gte: startOfToday, lt: endOfToday },
        },
      }),
      prisma.employeeProfile.count({ where: { companyId } }),
      prisma.department.count({ where: { companyId, deletedAt: null } }),
    ]);

    return {
      totalAssets,
      availableAssets,
      underMaintenance,
      totalMaintenanceOpen,
      totalAuditsActive,
      totalBookingsToday,
      totalEmployees,
      totalDepartments,
    };
  }

  public async getKpi(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAssets,
      availableAssets,
      underMaintenance,
      openMaintenance,
      completedThisMonth,
      completedLastMonth,
      auditsDue,
    ] = await prisma.$transaction([
      prisma.asset.count({ where: { companyId, deletedAt: null } }),
      prisma.asset.count({
        where: { companyId, deletedAt: null, status: AssetStatus.AVAILABLE },
      }),
      prisma.asset.count({
        where: { companyId, deletedAt: null, status: AssetStatus.UNDER_MAINTENANCE },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, status: { in: MAINTENANCE_OPEN_STATUSES } },
      }),
      prisma.maintenanceRequest.count({
        where: { companyId, status: MaintenanceStatus.COMPLETED, completedAt: { gte: startOfMonth } },
      }),
      prisma.maintenanceRequest.count({
        where: {
          companyId,
          status: MaintenanceStatus.COMPLETED,
          completedAt: { gte: startOfLastMonth, lt: endOfLastMonth },
        },
      }),
      prisma.auditAssignment.count({
        where: {
          cycle: { companyId },
          deletedAt: null,
          scheduledDate: { lte: now },
          status: { notIn: [AuditStatus.COMPLETED, AuditStatus.CLOSED] },
        },
      }),
    ]);

    const utilizationRate = totalAssets > 0 ? (availableAssets / totalAssets) * 100 : 0;

    return {
      totalAssets,
      availableAssets,
      underMaintenance,
      openMaintenance,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      completedThisMonth,
      auditsDue,
      deltas: {
        openMaintenance: { current: openMaintenance, previous: openMaintenance, delta: 0 },
        completedMaintenance: {
          current: completedThisMonth,
          previous: completedLastMonth,
          delta: completedThisMonth - completedLastMonth,
        },
      },
    };
  }

  public async getAssetsOverview(companyId: string) {
    const [byStatus, byCondition, byCategory] = await prisma.$transaction([
      prisma.asset.groupBy({
        by: ["status"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.asset.groupBy({
        by: ["condition"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.asset.groupBy({
        by: ["categoryId"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const categoryIds = byCategory.map((c: any) => c.categoryId);
    const categories =
      categoryIds.length > 0
        ? await prisma.assetCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [];
    const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));

    return {
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count._all })),
      byCondition: byCondition.map((c: any) => ({ condition: c.condition, count: c._count._all })),
      byCategory: byCategory.map((c: any) => ({
        id: c.categoryId,
        name: categoryMap.get(c.categoryId) || "Unknown",
        count: c._count._all,
      })),
    };
  }

  public async getMaintenanceOverview(companyId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [byStatus, byPriority, records] = await prisma.$transaction([
      prisma.maintenanceRequest.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { _all: true },
      }),
      prisma.maintenanceRequest.groupBy({
        by: ["priority"],
        where: { companyId },
        _count: { _all: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: { companyId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, completedAt: true, status: true },
      }),
    ]);

    const trend = this.buildMaintenanceTrend(records, sixMonthsAgo);

    return {
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count._all })),
      byPriority: byPriority.map((p: any) => ({ priority: p.priority, count: p._count._all })),
      trend,
    };
  }

  public async getAuditOverview(companyId: string) {
    const [activeCycles, byStatus, discrepanciesOpen] = await prisma.$transaction([
      prisma.auditCycle.count({ where: { companyId, isActive: true, deletedAt: null } }),
      prisma.auditAssignment.groupBy({
        by: ["status"],
        where: { cycle: { companyId }, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.auditDiscrepancy.count({
        where: { status: "OPEN", result: { cycle: { companyId } } },
      }),
    ]);

    return {
      activeCycles,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count._all })),
      discrepanciesOpen,
    };
  }

  public async getBookingOverview(companyId: string) {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [today, upcoming, active, byStatus] = await prisma.$transaction([
      prisma.resourceBooking.count({
        where: {
          resource: { companyId, deletedAt: null },
          startTime: { gte: startOfToday, lt: endOfToday },
        },
      }),
      prisma.resourceBooking.count({
        where: {
          resource: { companyId, deletedAt: null },
          startTime: { gt: now },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
      }),
      prisma.resourceBooking.count({
        where: { resource: { companyId, deletedAt: null }, status: BookingStatus.ACTIVE },
      }),
      prisma.resourceBooking.groupBy({
        by: ["status"],
        where: { resource: { companyId, deletedAt: null } },
        _count: { _all: true },
      }),
    ]);

    return {
      today,
      upcoming,
      active,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count._all })),
    };
  }

  public async getDepartmentOverview(companyId: string) {
    const [assetsByDept, maintenance] = await prisma.$transaction([
      prisma.asset.groupBy({
        by: ["departmentId"],
        where: { companyId, deletedAt: null, departmentId: { not: null } },
        _count: { _all: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: { companyId },
        select: { asset: { select: { departmentId: true } } },
      }),
    ]);

    const deptIds = assetsByDept.map((a: any) => a.departmentId);
    const departments =
      deptIds.length > 0
        ? await prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true },
          })
        : [];
    const deptMap = new Map(departments.map((d: any) => [d.id, d.name]));

    const maintenanceCount: Record<string, number> = {};
    for (const m of maintenance) {
      const deptId = m.asset?.departmentId;
      if (deptId) {
        maintenanceCount[deptId] = (maintenanceCount[deptId] || 0) + 1;
      }
    }

    const assetsPerDepartment = assetsByDept.map((a: any) => ({
      id: a.departmentId,
      name: deptMap.get(a.departmentId) || "Unknown",
      count: a._count._all,
    }));

    const maintenancePerDepartment = assetsPerDepartment.map((d: any) => ({
      id: d.id,
      name: d.name,
      count: maintenanceCount[d.id] || 0,
    }));

    return { assetsPerDepartment, maintenancePerDepartment };
  }

  public async getRecentActivities(companyId: string, limit = 10) {
    return prisma.activityLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  public async getUpcomingTasks(companyId: string) {
    const now = new Date();

    const [maintenance, audits] = await prisma.$transaction([
      prisma.maintenanceRequest.findMany({
        where: {
          companyId,
          scheduledDate: { gte: now },
          status: { in: MAINTENANCE_OPEN_STATUSES },
        },
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          status: true,
        },
        orderBy: { scheduledDate: "asc" },
      }),
      prisma.auditAssignment.findMany({
        where: {
          cycle: { companyId },
          deletedAt: null,
          scheduledDate: { gte: now },
          status: { notIn: [AuditStatus.COMPLETED, AuditStatus.CLOSED] },
        },
        select: {
          id: true,
          scheduledDate: true,
          status: true,
          cycle: { select: { name: true } },
        },
        orderBy: { scheduledDate: "asc" },
      }),
    ]);

    const items = [
      ...maintenance.map((m: any) => ({
        id: m.id,
        type: "MAINTENANCE" as const,
        title: m.title,
        scheduledDate: m.scheduledDate,
        status: m.status,
      })),
      ...audits.map((a: any) => ({
        id: a.id,
        type: "AUDIT" as const,
        title: a.cycle?.name || "Audit Assignment",
        scheduledDate: a.scheduledDate,
        status: a.status,
      })),
    ];

    items.sort((a, b) => {
      const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      return da - db;
    });

    return items.slice(0, 20);
  }

  public async getOverdueItems(companyId: string) {
    const now = new Date();

    const [maintenance, bookings, audits] = await prisma.$transaction([
      prisma.maintenanceRequest.findMany({
        where: {
          companyId,
          status: { in: [MaintenanceStatus.REQUESTED, MaintenanceStatus.IN_PROGRESS] },
          scheduledDate: { lt: now },
        },
        select: { id: true, title: true, scheduledDate: true, status: true },
        orderBy: { scheduledDate: "asc" },
      }),
      prisma.resourceBooking.findMany({
        where: {
          resource: { companyId, deletedAt: null },
          status: BookingStatus.OVERDUE,
          endTime: { lt: now },
        },
        select: { id: true, title: true, endTime: true, status: true },
        orderBy: { endTime: "asc" },
      }),
      prisma.auditAssignment.findMany({
        where: {
          cycle: { companyId },
          deletedAt: null,
          scheduledDate: { lt: now },
          status: { notIn: [AuditStatus.COMPLETED, AuditStatus.CLOSED] },
        },
        select: {
          id: true,
          scheduledDate: true,
          status: true,
          cycle: { select: { name: true } },
        },
        orderBy: { scheduledDate: "asc" },
      }),
    ]);

    return [
      ...maintenance.map((m: any) => ({
        id: m.id,
        type: "MAINTENANCE" as const,
        title: m.title,
        scheduledDate: m.scheduledDate,
        status: m.status,
      })),
      ...bookings.map((b: any) => ({
        id: b.id,
        type: "BOOKING" as const,
        title: b.title,
        scheduledDate: b.endTime,
        status: b.status,
      })),
      ...audits.map((a: any) => ({
        id: a.id,
        type: "AUDIT" as const,
        title: a.cycle?.name || "Audit Assignment",
        scheduledDate: a.scheduledDate,
        status: a.status,
      })),
    ];
  }

  public async getWidgets(userId: string) {
    return prisma.dashboardWidget.findMany({
      where: { userId },
      orderBy: [{ positionY: "asc" }, { positionX: "asc" }],
    });
  }

  public async createWidget(data: any) {
    return prisma.dashboardWidget.create({ data });
  }

  public async updateWidget(id: string, userId: string, data: any) {
    const existing = await prisma.dashboardWidget.findFirst({ where: { id } });
    if (!existing) {
      return null;
    }
    if (existing.userId && existing.userId !== userId) {
      return "FORBIDDEN";
    }
    return prisma.dashboardWidget.update({ where: { id }, data });
  }

  public async deleteWidget(id: string, userId: string) {
    const existing = await prisma.dashboardWidget.findFirst({ where: { id } });
    if (!existing) {
      return null;
    }
    if (existing.userId && existing.userId !== userId) {
      return "FORBIDDEN";
    }
    await prisma.dashboardWidget.delete({ where: { id } });
    return existing;
  }

  private buildMaintenanceTrend(records: any[], from: Date): any[] {
    const buckets: Record<string, { requested: number; completed: number }> = {};
    const monthOrder: string[] = [];

    for (let i = 0; i < 6; i++) {
      const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = { requested: 0, completed: 0 };
      monthOrder.push(key);
    }

    for (const r of records) {
      if (r.createdAt) {
        const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (buckets[key]) buckets[key].requested += 1;
      }
      if (r.completedAt) {
        const key = `${r.completedAt.getFullYear()}-${String(r.completedAt.getMonth() + 1).padStart(2, "0")}`;
        if (buckets[key]) buckets[key].completed += 1;
      }
    }

    return monthOrder.map((key) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return {
        month: key,
        label: date.toLocaleString("default", { month: "short", year: "numeric" }),
        requested: buckets[key].requested,
        completed: buckets[key].completed,
      };
    });
  }
}
