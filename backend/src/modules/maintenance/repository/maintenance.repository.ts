import { prisma } from "../../../config/prisma";
import { MaintenanceStatus, PriorityLevel } from "@prisma/client";
import { MaintenanceListFilters, PaginatedResult } from "../types/maintenance.types";

export class MaintenanceRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.maintenanceRequest.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.maintenanceRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            status: true,
            departmentId: true,
          },
        },
        requestor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
        verifier: {
          select: { id: true, firstName: true, lastName: true },
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          orderBy: { changedAt: "asc" },
        },
        technicians: {
          orderBy: { assignedAt: "asc" },
        },
      },
    });
  }

  public async findByIdForUpdate(id: string) {
    return prisma.maintenanceRequest.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        companyId: true,
        assetId: true,
        requestedBy: true,
        status: true,
        priority: true,
        title: true,
        description: true,
        type: true,
      },
    });
  }

  public async findMany(companyId: string, filters: MaintenanceListFilters): Promise<PaginatedResult<any>> {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.requestedBy) where.requestedBy = filters.requestedBy;
    if (filters.technicianId) {
      where.technicians = { some: { technicianId: filters.technicianId } };
    }
    if (filters.departmentId) {
      where.asset = { departmentId: filters.departmentId };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const [rows, total] = await prisma.$transaction([
      prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          asset: {
            select: { id: true, name: true, assetTag: true, status: true, departmentId: true },
          },
          requestor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async search(companyId: string, filters: MaintenanceListFilters): Promise<PaginatedResult<any>> {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    const term = (filters as any).q || filters.search;
    if (term) {
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { asset: { name: { contains: term, mode: "insensitive" } } },
        { asset: { assetTag: { contains: term, mode: "insensitive" } } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.requestedBy) where.requestedBy = filters.requestedBy;
    if (filters.technicianId) {
      where.technicians = { some: { technicianId: filters.technicianId } };
    }
    if (filters.departmentId) {
      where.asset = { ...(where.asset || {}), departmentId: filters.departmentId };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const [rows, total] = await prisma.$transaction([
      prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          asset: {
            select: { id: true, name: true, assetTag: true, status: true, departmentId: true },
          },
          requestor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async createStatusHistory(data: {
    requestId: string;
    previousStatus?: MaintenanceStatus | null;
    newStatus: MaintenanceStatus;
    reason?: string | null;
    changedBy?: string | null;
  }) {
    return prisma.maintenanceStatusHistory.create({
      data: {
        requestId: data.requestId,
        previousStatus: data.previousStatus ?? null,
        newStatus: data.newStatus,
        reason: data.reason ?? null,
        changedBy: data.changedBy ?? null,
      },
    });
  }

  public async getStatusHistory(requestId: string) {
    return prisma.maintenanceStatusHistory.findMany({
      where: { requestId },
      orderBy: { changedAt: "asc" },
    });
  }

  public async createTechnicianAssignment(data: {
    requestId: string;
    technicianId: string;
    assignedBy: string;
    role?: string;
    notes?: string | null;
  }) {
    return prisma.technicianAssignment.create({
      data: {
        requestId: data.requestId,
        technicianId: data.technicianId,
        assignedBy: data.assignedBy,
        role: data.role ?? "PRIMARY",
        notes: data.notes ?? null,
      },
    });
  }

  public async createAttachment(data: {
    requestId: string;
    fileId?: string | null;
    attachmentType?: string;
    description?: string | null;
    uploadedBy: string;
  }) {
    return prisma.maintenanceAttachment.create({
      data: {
        requestId: data.requestId,
        fileId: data.fileId ?? null,
        attachmentType: data.attachmentType ?? "DOCUMENT",
        description: data.description ?? null,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  public async getAttachments(requestId: string) {
    return prisma.maintenanceAttachment.findMany({
      where: { requestId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  public async findAttachmentById(attachmentId: string, requestId: string) {
    return prisma.maintenanceAttachment.findFirst({
      where: { id: attachmentId, requestId, deletedAt: null },
    });
  }

  public async softDeleteAttachment(attachmentId: string) {
    return prisma.maintenanceAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });
  }

  public async getAssetById(assetId: string, companyId: string) {
    return prisma.asset.findFirst({
      where: { id: assetId, companyId, deletedAt: null },
    });
  }

  public async updateAssetStatus(assetId: string, status: any) {
    return prisma.asset.update({
      where: { id: assetId },
      data: { status },
    });
  }

  public async getTechnicianAssignments(requestId: string) {
    return prisma.technicianAssignment.findMany({
      where: { requestId },
      orderBy: { assignedAt: "asc" },
    });
  }
}
