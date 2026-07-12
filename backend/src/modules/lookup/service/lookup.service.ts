import { LookupRepository } from "../repository/lookup.repository";
import { NotFoundError, ConflictError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";

export class LookupService {
  private repository = new LookupRepository();

  // ---------------------------------------------------------------- Lookups
  public async listLookups(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const filters = {
      category: query.category,
      isActive:
        query.isActive === undefined
          ? undefined
          : query.isActive === "true" || query.isActive === true,
    };

    const lookups = await this.repository.findLookups(companyId, filters);
    const total = lookups.length;
    const start = (page - 1) * limit;
    const data = lookups.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async listLookupsByCategory(companyId: string, category: string) {
    return this.repository.findLookups(companyId, { category });
  }

  public async createLookup(companyId: string, data: any, currentUserId: string) {
    const targetCompanyId = data.companyId !== undefined ? data.companyId : companyId;

    const existing = await this.repository.findLookupByUnique(targetCompanyId, data.category, data.code);
    if (existing) {
      throw new ConflictError("Lookup with this category and code already exists");
    }

    const lookup = await this.repository.createLookup({
      companyId: targetCompanyId,
      category: data.category,
      code: data.code,
      label: data.label,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      metadata: data.metadata ?? null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "LOOKUP_CREATED",
      entityType: "LookupTable",
      entityId: lookup.id,
      entityName: lookup.label,
      newValue: lookup,
    });

    return lookup;
  }

  public async updateLookup(companyId: string, id: string, data: any, currentUserId: string) {
    const existing = await this.repository.findLookupById(id);
    if (!existing) {
      throw new NotFoundError("Lookup not found");
    }

    const updateData: any = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const lookup = await this.repository.updateLookup(id, updateData);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "LOOKUP_UPDATED",
      entityType: "LookupTable",
      entityId: lookup.id,
      entityName: lookup.label,
      oldValue: existing,
      newValue: lookup,
    });

    return lookup;
  }

  public async deleteLookup(companyId: string, id: string, currentUserId: string) {
    const existing = await this.repository.findLookupById(id);
    if (!existing) {
      throw new NotFoundError("Lookup not found");
    }

    await this.repository.deleteLookup(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "LOOKUP_DELETED",
      entityType: "LookupTable",
      entityId: id,
      entityName: existing.label,
      oldValue: existing,
    });

    return { id };
  }

  // ----------------------------------------------------------- MasterStatus
  public async listMasterStatuses(companyId: string, query: any) {
    const filters = {
      entityType: query.entityType,
      isActive:
        query.isActive === undefined
          ? undefined
          : query.isActive === "true" || query.isActive === true,
    };
    return this.repository.findMasterStatuses(companyId, filters);
  }

  public async listMasterStatusesByEntityType(companyId: string, entityType: string) {
    return this.repository.findMasterStatuses(companyId, { entityType });
  }

  public async createMasterStatus(companyId: string, data: any, currentUserId: string) {
    const targetCompanyId = data.companyId !== undefined ? data.companyId : companyId;

    const existing = await this.repository.findMasterStatusByUnique(
      targetCompanyId,
      data.entityType,
      data.statusCode
    );
    if (existing) {
      throw new ConflictError("Master status with this entity type and status code already exists");
    }

    const status = await this.repository.createMasterStatus({
      companyId: targetCompanyId,
      entityType: data.entityType,
      statusCode: data.statusCode,
      label: data.label,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      transitions: data.transitions ?? null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "MASTER_STATUS_CREATED",
      entityType: "MasterStatusTable",
      entityId: status.id,
      entityName: status.label,
      newValue: status,
    });

    return status;
  }

  public async updateMasterStatus(companyId: string, id: string, data: any, currentUserId: string) {
    const existing = await this.repository.findMasterStatusById(id);
    if (!existing) {
      throw new NotFoundError("Master status not found");
    }

    const updateData: any = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.transitions !== undefined) updateData.transitions = data.transitions;

    const status = await this.repository.updateMasterStatus(id, updateData);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "MASTER_STATUS_UPDATED",
      entityType: "MasterStatusTable",
      entityId: status.id,
      entityName: status.label,
      oldValue: existing,
      newValue: status,
    });

    return status;
  }

  public async deleteMasterStatus(companyId: string, id: string, currentUserId: string) {
    const existing = await this.repository.findMasterStatusById(id);
    if (!existing) {
      throw new NotFoundError("Master status not found");
    }

    await this.repository.deleteMasterStatus(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "MASTER_STATUS_DELETED",
      entityType: "MasterStatusTable",
      entityId: id,
      entityName: existing.label,
      oldValue: existing,
    });

    return { id };
  }
}
