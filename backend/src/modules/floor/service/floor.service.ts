import { FloorRepository } from "../repository/floor.repository";
import { ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class FloorService {
  private repository = new FloorRepository();

  public async createFloor(data: any, currentUserId: string, companyId: string) {
    // Verify Building exists
    const building = await prisma.building.findFirst({
      where: { id: data.buildingId, deletedAt: null },
    });
    if (!building) {
      throw new NotFoundError("Building not found");
    }

    const existing = await this.repository.findByBuildingAndLevel(data.buildingId, data.levelNumber);
    if (existing) {
      throw new ConflictError(`Floor level ${data.levelNumber} already exists in this building`);
    }

    const floor = await this.repository.create(data, currentUserId);

    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "FLOOR_CREATED",
      entityType: "Floor",
      entityId: floor.id,
      entityName: floor.name,
      newValue: floor,
    });

    return floor;
  }

  public async updateFloor(id: string, data: any, currentUserId: string, companyId: string) {
    const floor = await this.repository.findById(id);
    if (!floor) {
      throw new NotFoundError("Floor not found");
    }

    if (data.levelNumber !== undefined && data.levelNumber !== floor.levelNumber) {
      const existing = await this.repository.findByBuildingAndLevel(floor.buildingId, data.levelNumber);
      if (existing) {
        throw new ConflictError(`Floor level ${data.levelNumber} already exists in this building`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId: floor.companyId,
      userId: currentUserId,
      action: "FLOOR_UPDATED",
      entityType: "Floor",
      entityId: id,
      entityName: updated.name,
      oldValue: floor,
      newValue: data,
    });

    return updated;
  }

  public async deleteFloor(id: string, currentUserId: string, companyId: string) {
    const floor = await this.repository.findById(id);
    if (!floor) {
      throw new NotFoundError("Floor not found");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId: floor.companyId,
      userId: currentUserId,
      action: "FLOOR_DELETED",
      entityType: "Floor",
      entityId: id,
      entityName: floor.name,
    });

    return { success: true };
  }

  public async getFloorById(id: string) {
    const floor = await this.repository.findById(id);
    if (!floor) {
      throw new NotFoundError("Floor not found");
    }
    return floor;
  }

  public async getFloors(companyId: string) {
    return this.repository.findMany(companyId);
  }
}
