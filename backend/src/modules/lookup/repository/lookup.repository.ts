import { prisma } from "../../../config/prisma";

export class LookupRepository {
  // ---------------------------------------------------------------- Lookups
  public async findLookups(companyId: string, filters?: any) {
    const where: any = {
      OR: [{ companyId }, { companyId: null }],
    };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.lookupTable.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });
  }

  public async findLookupById(id: string) {
    return prisma.lookupTable.findUnique({
      where: { id },
    });
  }

  public async findLookupByUnique(companyId: string | null, category: string, code: string) {
    return prisma.lookupTable.findFirst({
      where: { companyId, category, code },
    });
  }

  public async createLookup(data: any) {
    return prisma.lookupTable.create({
      data,
    });
  }

  public async updateLookup(id: string, data: any) {
    return prisma.lookupTable.update({
      where: { id },
      data,
    });
  }

  public async deleteLookup(id: string) {
    return prisma.lookupTable.delete({
      where: { id },
    });
  }

  // ----------------------------------------------------------- MasterStatus
  public async findMasterStatuses(companyId: string, filters?: any) {
    const where: any = {
      OR: [{ companyId }, { companyId: null }],
    };

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.masterStatusTable.findMany({
      where,
      orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });
  }

  public async findMasterStatusById(id: string) {
    return prisma.masterStatusTable.findUnique({
      where: { id },
    });
  }

  public async findMasterStatusByUnique(companyId: string | null, entityType: string, statusCode: string) {
    return prisma.masterStatusTable.findFirst({
      where: { companyId, entityType, statusCode },
    });
  }

  public async createMasterStatus(data: any) {
    return prisma.masterStatusTable.create({
      data,
    });
  }

  public async updateMasterStatus(id: string, data: any) {
    return prisma.masterStatusTable.update({
      where: { id },
      data,
    });
  }

  public async deleteMasterStatus(id: string) {
    return prisma.masterStatusTable.delete({
      where: { id },
    });
  }
}
