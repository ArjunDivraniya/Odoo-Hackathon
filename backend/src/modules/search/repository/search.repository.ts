import { prisma } from "../../../config/prisma";
import { SearchEntityType } from "../types/search.types";

export class SearchRepository {
  public async searchAssets(companyId: string, q: string, limit: number) {
    return prisma.asset.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { assetTag: { contains: q, mode: "insensitive" } },
          { serialNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { name: "asc" },
    });
  }

  public async searchEmployees(companyId: string, q: string, limit: number) {
    return prisma.employeeProfile.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { employeeId: { contains: q, mode: "insensitive" } },
          { jobTitle: { contains: q, mode: "insensitive" } },
          { user: { firstName: { contains: q, mode: "insensitive" } } },
          { user: { lastName: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { user: true },
      take: limit,
      orderBy: { employeeId: "asc" },
    });
  }

  public async searchDepartments(companyId: string, q: string, limit: number) {
    return prisma.department.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { name: "asc" },
    });
  }

  public async searchMaintenance(companyId: string, q: string, limit: number) {
    return prisma.maintenanceRequest.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  public async searchAudit(companyId: string, q: string, limit: number) {
    return prisma.auditCycle.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { startDate: "desc" },
    });
  }

  public async searchNotifications(userId: string, q: string, limit: number) {
    return prisma.notification.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  public async searchReports(companyId: string, q: string, limit: number) {
    return prisma.reportMetadata.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { name: "asc" },
    });
  }

  public async searchFiles(companyId: string, q: string, limit: number) {
    return prisma.fileStorage.findMany({
      where: {
        companyId,
        deletedAt: null,
        originalName: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  public async fetchFilterDimensions(companyId: string) {
    const [departments, employeeProfiles, auditCycles, notificationTypes] = await Promise.all([
      prisma.department.findMany({
        where: { companyId, deletedAt: null, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.employeeProfile.findMany({
        where: { companyId, deletedAt: null },
        include: { user: true },
        orderBy: { employeeId: "asc" },
      }),
      prisma.auditCycle.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { startDate: "desc" },
      }),
      prisma.notification.findMany({
        where: { deletedAt: null, user: { employeeProfile: { companyId } } },
        select: { type: true },
        distinct: ["type"],
        orderBy: { type: "asc" },
      }),
    ]);

    const users = employeeProfiles.map((ep: any) => ({
      id: ep.id,
      name: [ep.user?.firstName, ep.user?.lastName].filter(Boolean).join(" ").trim() || ep.employeeId,
    }));

    return {
      departments,
      users,
      technicians: users,
      auditCycles,
      notificationTypes: notificationTypes.map((n: any) => n.type),
    };
  }

  public async logSearch(companyId: string, userId: string, payload: { q?: string; types?: string }) {
    return prisma.activityLog.create({
      data: {
        companyId,
        userId,
        action: "SEARCH",
        entityType: "Search",
        entityName: payload.q || "global",
        newValue: payload as any,
      },
    });
  }
}
