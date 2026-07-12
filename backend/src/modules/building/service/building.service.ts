import { BuildingRepository } from "../repository/building.repository";
import { ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class BuildingService {
  private repository = new BuildingRepository();

  public async createBuilding(data: any, currentUserId: string, companyId: string) {
    // Verify Office exists
    const office = await prisma.office.findFirst({
      where: { id: data.officeId, deletedAt: null },
    });
    if (!office) {
      throw new NotFoundError("Office not found");
    }

    const existing = await this.repository.findByOfficeAndCode(data.officeId, data.code);
    if (existing) {
      throw new ConflictError(`Building code "${data.code}" already exists in this office`);
    }

    const building = await this.repository.create(data, currentUserId);

    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "BUILDING_CREATED",
      entityType: "Building",
      entityId: building.id,
      entityName: building.name,
      newValue: building,
    });

    return building;
  }

  public async updateBuilding(id: string, data: any, currentUserId: string, companyId: string) {
    const building = await this.repository.findById(id);
    if (!building) {
      throw new NotFoundError("Building not found");
    }

    if (data.code && data.code !== building.code) {
      const existing = await this.repository.findByOfficeAndCode(building.officeId, data.code);
      if (existing) {
        throw new ConflictError(`Building code "${data.code}" already exists in this office`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId: building.companyId,
      userId: currentUserId,
      action: "BUILDING_UPDATED",
      entityType: "Building",
      entityId: id,
      entityName: updated.name,
      oldValue: building,
      newValue: data,
    });

    return updated;
  }

  public async deleteBuilding(id: string, currentUserId: string, companyId: string) {
    const building = await this.repository.findById(id);
    if (!building) {
      throw new NotFoundError("Building not found");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId: building.companyId,
      userId: currentUserId,
      action: "BUILDING_DELETED",
      entityType: "Building",
      entityId: id,
      entityName: building.name,
    });

    return { success: true };
  }

  public async getBuildingById(id: string) {
    const building = await this.repository.findById(id);
    if (!building) {
      throw new NotFoundError("Building not found");
    }
    return building;
  }

  public async getBuildings(companyId: string) {
    return this.repository.findMany(companyId);
  }
}
