import { AssetCategoryRepository } from "../repository/asset-category.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { prisma } from "../../../config/prisma";

export class AssetCategoryService {
  private repository = new AssetCategoryRepository();

  public async createCategory(data: any, currentUserId: string, companyId: string) {
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, deletedAt: null },
    });
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    const existing = await this.repository.findByCompanyAndCode(data.companyId, data.code);
    if (existing) {
      throw new ConflictError(`Asset category code "${data.code}" already exists in this company`);
    }

    let level = 0;
    if (data.parentId) {
      const parent = await this.repository.findById(data.parentId);
      if (!parent) {
        throw new NotFoundError("Parent category not found");
      }
      if (parent.companyId !== data.companyId) {
        throw new BadRequestError("Parent category does not belong to this company");
      }
      level = (parent.level || 0) + 1;
    }

    const category = await this.repository.create(
      { ...data, level },
      currentUserId
    );

    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "ASSET_CATEGORY_CREATED",
      entityType: "AssetCategory",
      entityId: category.id,
      entityName: category.name,
      newValue: category,
    });

    return category;
  }

  public async updateCategory(id: string, data: any, currentUserId: string, companyId: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError("Asset category not found");
    }

    if (data.code && data.code !== category.code) {
      const existing = await this.repository.findByCompanyAndCode(category.companyId, data.code);
      if (existing) {
        throw new ConflictError(`Asset category code "${data.code}" already exists in this company`);
      }
    }

    if (data.parentId !== undefined && data.parentId !== category.parentId) {
      if (data.parentId === id) {
        throw new BadRequestError("A category cannot be its own parent");
      }

      if (data.parentId) {
        const parent = await this.repository.findById(data.parentId);
        if (!parent) {
          throw new NotFoundError("Parent category not found");
        }
        if (parent.companyId !== companyId) {
          throw new BadRequestError("Parent category does not belong to this company");
        }
        const ancestors = await this.repository.getAncestors(id);
        if (ancestors.some((a) => a.id === data.parentId)) {
          throw new BadRequestError("Cyclic relationship detected");
        }
        data.level = (parent.level || 0) + 1;
      } else {
        data.level = 0;
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_CATEGORY_UPDATED",
      entityType: "AssetCategory",
      entityId: id,
      entityName: updated.name,
      oldValue: category,
      newValue: data,
    });

    return updated;
  }

  public async deleteCategory(id: string, currentUserId: string, companyId: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError("Asset category not found");
    }

    const children = await this.repository.findChildren(id);
    if (children.length > 0) {
      throw new BadRequestError("Cannot delete category with existing children");
    }

    const assetCount = await prisma.asset.count({
      where: { assetCategoryId: id, deletedAt: null },
    });
    if (assetCount > 0) {
      throw new BadRequestError("Cannot delete category that has assets assigned to it");
    }

    await this.repository.softDelete(id, currentUserId);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "ASSET_CATEGORY_DELETED",
      entityType: "AssetCategory",
      entityId: id,
      entityName: category.name,
    });

    return { success: true };
  }

  public async getCategoryById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError("Asset category not found");
    }

    const children = await this.repository.findChildren(id);
    const customFields = await this.repository.findCustomFields(id);

    return { ...category, children, customFields };
  }

  public async getCategories(companyId: string) {
    return this.repository.findMany(companyId);
  }

  public async getCategoryTree(companyId: string) {
    const categories = await this.repository.findMany(companyId);

    const categoryMap = new Map<string, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  public async addCustomField(categoryId: string, data: any, currentUserId: string) {
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Asset category not found");
    }

    const existingFields = await this.repository.findCustomFields(categoryId);
    if (existingFields.some((f: { name: string }) => f.name === data.name)) {
      throw new ConflictError(`Custom field "${data.name}" already exists for this category`);
    }

    return this.repository.createCustomField(categoryId, data);
  }

  public async updateCustomField(fieldId: string, data: any, currentUserId: string) {
    const field = await prisma.categoryCustomField.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundError("Custom field not found");
    }

    return this.repository.updateCustomField(fieldId, data);
  }

  public async deleteCustomField(fieldId: string, currentUserId: string) {
    const field = await prisma.categoryCustomField.findUnique({ where: { id: fieldId } });
    if (!field) {
      throw new NotFoundError("Custom field not found");
    }

    return this.repository.deleteCustomField(fieldId);
  }
}
