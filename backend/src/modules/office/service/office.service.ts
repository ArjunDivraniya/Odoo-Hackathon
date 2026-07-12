import { OfficeRepository } from "../repository/office.repository";
import { ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class OfficeService {
  private repository = new OfficeRepository();

  public async createOffice(data: any, currentUserId: string, companyId: string) {
    // Verify Company exists
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, deletedAt: null },
    });
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    const existing = await this.repository.findByCompanyAndCode(data.companyId, data.code);
    if (existing) {
      throw new ConflictError(`Office code "${data.code}" already exists in this company`);
    }

    const office = await this.repository.create(data, currentUserId);

    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "OFFICE_CREATED",
      entityType: "Office",
      entityId: office.id,
      entityName: office.name,
      newValue: office,
    });

    return office;
  }

  public async updateOffice(id: string, data: any, currentUserId: string, companyId: string) {
    const office = await this.repository.findById(id);
    if (!office) {
      throw new NotFoundError("Office not found");
    }

    if (data.code && data.code !== office.code) {
      const existing = await this.repository.findByCompanyAndCode(office.companyId, data.code);
      if (existing) {
        throw new ConflictError(`Office code "${data.code}" already exists in this company`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId: office.companyId,
      userId: currentUserId,
      action: "OFFICE_UPDATED",
      entityType: "Office",
      entityId: id,
      entityName: updated.name,
      oldValue: office,
      newValue: data,
    });

    return updated;
  }

  public async deleteOffice(id: string, currentUserId: string, companyId: string) {
    const office = await this.repository.findById(id);
    if (!office) {
      throw new NotFoundError("Office not found");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId: office.companyId,
      userId: currentUserId,
      action: "OFFICE_DELETED",
      entityType: "Office",
      entityId: id,
      entityName: office.name,
    });

    return { success: true };
  }

  public async getOfficeById(id: string) {
    const office = await this.repository.findById(id);
    if (!office) {
      throw new NotFoundError("Office not found");
    }
    return office;
  }

  public async getOffices(companyId: string) {
    return this.repository.findMany(companyId);
  }
}
