import { prisma } from "../../../config/prisma";

export class BookingRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.resourceBooking.create({
      data: {
        ...data,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.resourceBooking.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.resourceBooking.findFirst({
      where: { id, deletedAt: null },
      include: {
        resource: true,
        bookedByUser: true,
        participants: true,
        history: true,
      },
    });
  }

  public async findMany(companyId: string, filters?: any) {
    const where: any = {
      deletedAt: null,
      resource: { companyId, deletedAt: null },
    };

    if (filters?.resourceId) {
      where.resourceId = filters.resourceId;
    }
    if (filters?.bookedBy) {
      where.bookedBy = filters.bookedBy;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate && filters?.endDate) {
      where.startTime = { gte: new Date(filters.startDate) };
      where.endTime = { lte: new Date(filters.endDate) };
    }

    return prisma.resourceBooking.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: {
        resource: true,
        bookedByUser: true,
        participants: true,
      },
    });
  }

  public async findOverlappingBookings(resourceId: string, startTime: Date, endTime: Date, excludeId?: string) {
    const where: any = {
      resourceId,
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return prisma.resourceBooking.findMany({
      where,
    });
  }

  public async createHistory(data: any) {
    return prisma.bookingHistory.create({
      data,
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.resourceBooking.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async createParticipants(bookingId: string, userIds: string[]) {
    return prisma.bookingParticipant.createMany({
      data: userIds.map((userId) => ({
        bookingId,
        userId,
        status: "INVITED",
      })),
    });
  }

  public async deleteParticipants(bookingId: string) {
    return prisma.bookingParticipant.deleteMany({
      where: { bookingId },
    });
  }
}
