import { prisma } from "../../../config/prisma";
import { EmployeeStatus } from "@prisma/client";

export interface GetEmployeesFilter {
  q?: string; // Global search query
  status?: EmployeeStatus;
  departmentId?: string;
  officeId?: string;
  companyId: string;
  page?: number;
  limit?: number;
  sortBy?: "employeeId" | "jobTitle" | "hireDate" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export class EmployeeRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.employeeProfile.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        employeeId: data.employeeId,
        departmentId: data.departmentId || null,
        officeId: data.officeId || null,
        managerId: data.managerId || null,
        jobTitle: data.jobTitle || null,
        jobLevel: data.jobLevel || null,
        employmentType: data.employmentType || "FULL_TIME",
        status: data.status || EmployeeStatus.ACTIVE,
        hireDate: data.hireDate,
        terminationDate: data.terminationDate || null,
        salary: data.salary || null,
        emergencyContact: data.emergencyContact ? JSON.parse(JSON.stringify(data.emergencyContact)) : null,
        address: data.address ? JSON.parse(JSON.stringify(data.address)) : null,
        documents: data.documents ? JSON.parse(JSON.stringify(data.documents)) : null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.employeeProfile.update({
      where: { id },
      data: {
        ...data,
        emergencyContact: data.emergencyContact ? JSON.parse(JSON.stringify(data.emergencyContact)) : undefined,
        address: data.address ? JSON.parse(JSON.stringify(data.address)) : undefined,
        documents: data.documents ? JSON.parse(JSON.stringify(data.documents)) : undefined,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.employeeProfile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.employeeProfile.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
        department: true,
        office: true,
      },
    });
  }

  public async findByUserId(userId: string) {
    return prisma.employeeProfile.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  public async findByEmployeeId(employeeId: string) {
    return prisma.employeeProfile.findFirst({
      where: { employeeId, deletedAt: null },
    });
  }

  public async findMany(filter: GetEmployeesFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId: filter.companyId,
      deletedAt: null,
    };

    // Apply global search query
    if (filter.q) {
      where.OR = [
        { employeeId: { contains: filter.q, mode: "insensitive" } },
        { jobTitle: { contains: filter.q, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: filter.q, mode: "insensitive" } },
              { lastName: { contains: filter.q, mode: "insensitive" } },
              { email: { contains: filter.q, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.officeId) {
      where.officeId = filter.officeId;
    }

    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = filter.sortOrder || "desc";

    const items = await prisma.employeeProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        department: true,
        office: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const total = await prisma.employeeProfile.count({ where });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
