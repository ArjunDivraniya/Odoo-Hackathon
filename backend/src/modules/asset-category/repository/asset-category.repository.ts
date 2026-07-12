import { prisma } from "../../../config/prisma";

export class AssetCategoryRepository {
  public async create(data: any, createdBy?: string) {
    return prisma.assetCategory.create({
      data: {
        companyId: data.companyId,
        parentId: data.parentId || null,
        name: data.name,
        code: data.code,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        depreciationMethod: data.depreciationMethod || null,
        usefulLifeMonths: data.usefulLifeMonths || null,
        salvageValuePercent: data.salvageValuePercent || null,
        requiresMaintenance: data.requiresMaintenance ?? false,
        requiresCalibration: data.requiresCalibration ?? false,
        isActive: data.isActive ?? true,
        level: data.level ?? 0,
        sortOrder: data.sortOrder ?? 0,
        metadata: data.metadata || null,
        createdBy,
      },
    });
  }

  public async update(id: string, data: any, updatedBy?: string) {
    return prisma.assetCategory.update({
      where: { id },
      data: {
        parentId: data.parentId !== undefined ? data.parentId : undefined,
        name: data.name,
        code: data.code,
        description: data.description,
        icon: data.icon,
        color: data.color,
        depreciationMethod: data.depreciationMethod,
        usefulLifeMonths: data.usefulLifeMonths,
        salvageValuePercent: data.salvageValuePercent,
        requiresMaintenance: data.requiresMaintenance,
        requiresCalibration: data.requiresCalibration,
        isActive: data.isActive,
        level: data.level,
        sortOrder: data.sortOrder,
        metadata: data.metadata,
        updatedBy,
      },
    });
  }

  public async softDelete(id: string, updatedBy?: string) {
    return prisma.assetCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  public async findById(id: string) {
    return prisma.assetCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async findByCompanyAndCode(companyId: string, code: string) {
    return prisma.assetCategory.findFirst({
      where: { companyId, code, deletedAt: null },
    });
  }

  public async findMany(companyId: string) {
    return prisma.assetCategory.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  public async findChildren(parentId: string) {
    return prisma.assetCategory.findMany({
      where: { parentId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  public async getAncestors(categoryId: string) {
    const ancestors: any[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category: { id: string; parentId: string | null } | null = await prisma.assetCategory.findFirst({
        where: { id: currentId, deletedAt: null },
        select: { id: true, parentId: true },
      });
      if (!category || !category.parentId) break;
      const parent: { id: string } | null = await prisma.assetCategory.findFirst({
        where: { id: category.parentId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) break;
      ancestors.push(parent);
      currentId = parent.id;
    }

    return ancestors;
  }

  public async createCustomField(categoryId: string, data: any) {
    return prisma.categoryCustomField.create({
      data: {
        categoryId,
        name: data.name,
        label: data.label,
        fieldType: data.fieldType,
        isRequired: data.isRequired ?? false,
        isSearchable: data.isSearchable ?? false,
        isFilterable: data.isFilterable ?? false,
        defaultValue: data.defaultValue || null,
        options: data.options || null,
        validation: data.validation || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  public async updateCustomField(id: string, data: any) {
    return prisma.categoryCustomField.update({
      where: { id },
      data: {
        name: data.name,
        label: data.label,
        fieldType: data.fieldType,
        isRequired: data.isRequired,
        isSearchable: data.isSearchable,
        isFilterable: data.isFilterable,
        defaultValue: data.defaultValue,
        options: data.options,
        validation: data.validation,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  public async deleteCustomField(id: string) {
    return prisma.categoryCustomField.delete({
      where: { id },
    });
  }

  public async findCustomFields(categoryId: string) {
    return prisma.categoryCustomField.findMany({
      where: { categoryId },
      orderBy: { sortOrder: "asc" },
    });
  }
}
