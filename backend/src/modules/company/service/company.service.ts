import { CompanyRepository } from "../repository/company.repository";
import { ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";

export class CompanyService {
  private repository = new CompanyRepository();

  public async createCompany(data: any, currentUserId: string) {
    const existing = await this.repository.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError(`Company slug "${data.slug}" already exists`);
    }

    const company = await this.repository.create(data, currentUserId);

    await ActivityLogger.log({
      companyId: company.id,
      userId: currentUserId,
      action: "COMPANY_CREATED",
      entityType: "Company",
      entityId: company.id,
      entityName: company.name,
      newValue: company,
    });

    return company;
  }

  public async updateCompany(id: string, data: any, currentUserId: string) {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    if (data.slug && data.slug !== company.slug) {
      const existing = await this.repository.findBySlug(data.slug);
      if (existing) {
        throw new ConflictError(`Company slug "${data.slug}" already exists`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId: id,
      userId: currentUserId,
      action: "COMPANY_UPDATED",
      entityType: "Company",
      entityId: id,
      entityName: updated.name,
      oldValue: company,
      newValue: data,
    });

    return updated;
  }

  public async deleteCompany(id: string, currentUserId: string) {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId: id,
      userId: currentUserId,
      action: "COMPANY_DELETED",
      entityType: "Company",
      entityId: id,
      entityName: company.name,
    });

    return { success: true };
  }

  public async getCompanyById(id: string) {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new NotFoundError("Company not found");
    }
    return company;
  }

  public async getCompanies() {
    return this.repository.findMany();
  }
}
