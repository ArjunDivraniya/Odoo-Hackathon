import { ResourceRepository } from "../repository/resource.repository";
import { NotFoundError, ConflictError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class ResourceService {
  private repository = new ResourceRepository();

  public async createResource(data: any, currentUserId: string, companyId: string) {
    const existing = await this.repository.findByCompanyAndName(companyId, data.name);
    if (existing) {
      throw new ConflictError(`Resource with name "${data.name}" already exists`);
    }

    if (data.officeId) {
      const office = await prisma.office.findFirst({
        where: { id: data.officeId, companyId, deletedAt: null },
      });
      if (!office) {
        throw new NotFoundError("Office not found");
      }
    }

    const resource = await this.repository.create(
      {
        companyId,
        assetId: data.assetId || null,
        name: data.name,
        description: data.description || null,
        resourceType: data.resourceType,
        capacity: data.capacity || 1,
        officeId: data.officeId || null,
        locationId: data.locationId || null,
        isBookable: data.isBookable !== undefined ? data.isBookable : true,
        requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : false,
        maxBookingDurationHours: data.maxBookingDurationHours || null,
        bookingRules: data.bookingRules || null,
        operatingHours: data.operatingHours || null,
      },
      currentUserId
    );

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "RESOURCE_CREATED",
      entityType: "SharedResource",
      entityId: resource.id,
      entityName: resource.name,
      newValue: resource,
    });

    return resource;
  }

  public async updateResource(id: string, data: any, currentUserId: string, companyId: string) {
    const resource = await this.repository.findById(id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    if (data.name && data.name !== resource.name) {
      const existing = await this.repository.findByCompanyAndName(companyId, data.name);
      if (existing) {
        throw new ConflictError(`Resource with name "${data.name}" already exists`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "RESOURCE_UPDATED",
      entityType: "SharedResource",
      entityId: id,
      entityName: updated.name,
      oldValue: resource,
      newValue: data,
    });

    return updated;
  }

  public async deleteResource(id: string, currentUserId: string, companyId: string) {
    const resource = await this.repository.findById(id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    if (resource.bookings && resource.bookings.length > 0) {
      const activeBookings = resource.bookings.filter(
        (b: any) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(b.status)
      );
      if (activeBookings.length > 0) {
        throw new ConflictError("Cannot delete resource with active bookings");
      }
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "RESOURCE_DELETED",
      entityType: "SharedResource",
      entityId: id,
      entityName: resource.name,
    });

    return { success: true };
  }

  public async getResourceById(id: string) {
    const resource = await this.repository.findById(id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }
    return resource;
  }

  public async getResources(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const filters: any = {
      resourceType: query.resourceType,
      officeId: query.officeId,
      isBookable: query.isBookable !== undefined ? query.isBookable === "true" : undefined,
      isActive: query.isActive !== undefined ? query.isActive === "true" : undefined,
      search: query.search,
    };

    const resources = await this.repository.findMany(companyId, filters);
    const total = resources.length;
    const start = (page - 1) * limit;
    const paginatedResources = resources.slice(start, start + limit);

    return {
      data: paginatedResources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
