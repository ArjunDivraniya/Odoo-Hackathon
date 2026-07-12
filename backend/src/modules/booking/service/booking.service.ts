import { BookingRepository } from "../repository/booking.repository";
import { NotFoundError, ConflictError, BadRequestError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class BookingService {
  private repository = new BookingRepository();

  public async createBooking(data: any, currentUserId: string, companyId: string) {
    const resource = await prisma.sharedResource.findFirst({
      where: { id: data.resourceId, companyId, deletedAt: null },
    });
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    if (!resource.isActive) {
      throw new ConflictError("Resource is not active");
    }

    if (!resource.isBookable) {
      throw new ConflictError("Resource is not bookable");
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      throw new BadRequestError("End time must be after start time");
    }

    const overlapping = await this.repository.findOverlappingBookings(
      data.resourceId,
      startTime,
      endTime
    );
    if (overlapping.length > 0) {
      throw new ConflictError("Resource is already booked for the selected time slot");
    }

    const booking = await this.repository.create(
      {
        resourceId: data.resourceId,
        bookedBy: currentUserId,
        status: "PENDING",
        title: data.title,
        description: data.description || null,
        startTime,
        endTime,
        attendeeCount: data.attendeeCount || 1,
        notes: data.notes || null,
        isRecurring: data.isRecurring || false,
        recurrenceRule: data.recurrenceRule || null,
        recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
      },
      currentUserId
    );

    if (data.participantUserIds && data.participantUserIds.length > 0) {
      await this.repository.createParticipants(booking.id, data.participantUserIds);
    }

    await this.repository.createHistory({
      bookingId: booking.id,
      action: "CREATED",
      newValues: booking,
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "BOOKING_CREATED",
      entityType: "ResourceBooking",
      entityId: booking.id,
      entityName: booking.title,
      newValue: booking,
    });

    return booking;
  }

  public async confirmBooking(id: string, currentUserId: string, companyId: string) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status !== "PENDING") {
      throw new ConflictError("Booking cannot be confirmed in its current status");
    }

    const oldValues = { status: booking.status };
    const updated = await this.repository.update(id, { status: "CONFIRMED" }, currentUserId);

    await this.repository.createHistory({
      bookingId: id,
      action: "CONFIRMED",
      oldValues,
      newValues: { status: "CONFIRMED" },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "BOOKING_CONFIRMED",
      entityType: "ResourceBooking",
      entityId: id,
      entityName: booking.title,
      oldValue: oldValues,
      newValue: { status: "CONFIRMED" },
    });

    return updated;
  }

  public async cancelBooking(id: string, cancellationReason: string | undefined, currentUserId: string, companyId: string) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status === "COMPLETED") {
      throw new ConflictError("Cannot cancel a completed booking");
    }

    const oldValues = { status: booking.status };
    const updated = await this.repository.update(
      id,
      {
        status: "CANCELLED",
        cancellationReason: cancellationReason || null,
        cancelledAt: new Date(),
      },
      currentUserId
    );

    await this.repository.createHistory({
      bookingId: id,
      action: "CANCELLED",
      oldValues,
      newValues: { status: "CANCELLED", cancellationReason },
      performedBy: currentUserId,
      notes: cancellationReason || null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "BOOKING_CANCELLED",
      entityType: "ResourceBooking",
      entityId: id,
      entityName: booking.title,
      oldValue: oldValues,
      newValue: { status: "CANCELLED" },
    });

    return updated;
  }

  public async completeBooking(id: string, currentUserId: string, companyId: string) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (!["ACTIVE", "CONFIRMED"].includes(booking.status)) {
      throw new ConflictError("Booking cannot be completed in its current status");
    }

    const oldValues = { status: booking.status };
    const updated = await this.repository.update(
      id,
      {
        status: "COMPLETED",
        actualEnd: new Date(),
      },
      currentUserId
    );

    await this.repository.createHistory({
      bookingId: id,
      action: "COMPLETED",
      oldValues,
      newValues: { status: "COMPLETED" },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "BOOKING_COMPLETED",
      entityType: "ResourceBooking",
      entityId: id,
      entityName: booking.title,
      oldValue: oldValues,
      newValue: { status: "COMPLETED" },
    });

    return updated;
  }

  public async checkInBooking(id: string, currentUserId: string, companyId: string) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status !== "CONFIRMED") {
      throw new ConflictError("Booking must be confirmed before check-in");
    }

    const oldValues = { status: booking.status };
    const updated = await this.repository.update(
      id,
      {
        status: "ACTIVE",
        actualStart: new Date(),
      },
      currentUserId
    );

    await this.repository.createHistory({
      bookingId: id,
      action: "CHECKED_IN",
      oldValues,
      newValues: { status: "ACTIVE" },
      performedBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "BOOKING_CHECKED_IN",
      entityType: "ResourceBooking",
      entityId: id,
      entityName: booking.title,
      oldValue: oldValues,
      newValue: { status: "ACTIVE" },
    });

    return updated;
  }

  public async getBookingById(id: string) {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    return booking;
  }

  public async getBookings(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const filters: any = {
      resourceId: query.resourceId,
      bookedBy: query.bookedBy,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    const bookings = await this.repository.findMany(companyId, filters);
    const total = bookings.length;
    const start = (page - 1) * limit;
    const paginatedBookings = bookings.slice(start, start + limit);

    return {
      data: paginatedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
