import { LocationRepository } from "../repository/location.repository";
import { ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class LocationService {
  private repository = new LocationRepository();

  public async createLocation(data: any, currentUserId: string, companyId: string) {
    if (data.floorId) {
      // Verify Floor exists
      const floor = await prisma.floor.findFirst({
        where: { id: data.floorId, deletedAt: null },
      });
      if (!floor) {
        throw new NotFoundError("Floor not found");
      }

      const existing = await this.repository.findByFloorAndCode(data.floorId, data.code);
      if (existing) {
        throw new ConflictError(`Location code "${data.code}" already exists on this floor`);
      }
    }

    const location = await this.repository.create(data, currentUserId);

    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "LOCATION_CREATED",
      entityType: "Location",
      entityId: location.id,
      entityName: location.name,
      newValue: location,
    });

    return location;
  }

  public async updateLocation(id: string, data: any, currentUserId: string, companyId: string) {
    const location = await this.repository.findById(id);
    if (!location) {
      throw new NotFoundError("Location not found");
    }

    if (data.code && location.floorId && data.code !== location.code) {
      const existing = await this.repository.findByFloorAndCode(location.floorId, data.code);
      if (existing) {
        throw new ConflictError(`Location code "${data.code}" already exists on this floor`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId: location.companyId,
      userId: currentUserId,
      action: "LOCATION_UPDATED",
      entityType: "Location",
      entityId: id,
      entityName: updated.name,
      oldValue: location,
      newValue: data,
    });

    return updated;
  }

  public async deleteLocation(id: string, currentUserId: string, companyId: string) {
    const location = await this.repository.findById(id);
    if (!location) {
      throw new NotFoundError("Location not found");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId: location.companyId,
      userId: currentUserId,
      action: "LOCATION_DELETED",
      entityType: "Location",
      entityId: id,
      entityName: location.name,
    });

    return { success: true };
  }

  public async getLocationById(id: string) {
    const location = await this.repository.findById(id);
    if (!location) {
      throw new NotFoundError("Location not found");
    }
    return location;
  }

  public async getLocations(companyId: string) {
    return this.repository.findMany(companyId);
  }
}
