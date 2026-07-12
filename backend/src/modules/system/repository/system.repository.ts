import { prisma } from "../../../config/prisma";

export class SystemRepository {
  // ---------------------------------------------------------------- Settings
  public async findSettings(companyId: string, filters?: any) {
    const where: any = {
      OR: [{ companyId }, { companyId: null }],
    };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.key) {
      where.key = filters.key;
    }
    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    return prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });
  }

  public async findSettingByKey(companyId: string | null, key: string) {
    return prisma.systemSetting.findFirst({
      where: { companyId, key },
    });
  }

  public async findSettingsByKey(companyId: string, key: string) {
    return prisma.systemSetting.findMany({
      where: {
        key,
        OR: [{ companyId }, { companyId: null }],
      },
    });
  }

  public async findSettingsByCategory(companyId: string, category: string) {
    return prisma.systemSetting.findMany({
      where: {
        category,
        OR: [{ companyId }, { companyId: null }],
      },
      orderBy: { key: "asc" },
    });
  }

  public async upsertSetting(companyId: string | null, key: string, data: any, updatedBy?: string) {
    const existing = await prisma.systemSetting.findFirst({
      where: { companyId, key },
    });

    if (existing) {
      return prisma.systemSetting.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedBy: updatedBy ?? null,
        },
      });
    }

    return prisma.systemSetting.create({
      data: {
        companyId,
        key,
        ...data,
        updatedBy: updatedBy ?? null,
      },
    });
  }

  public async deleteSetting(id: string) {
    return prisma.systemSetting.delete({
      where: { id },
    });
  }

  // ------------------------------------------------------------ WorkingHours
  public async findWorkingHours(officeId: string) {
    return prisma.workingHour.findMany({
      where: { officeId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  public async upsertWorkingHour(officeId: string, effectiveFrom: Date, data: any) {
    const existing = await prisma.workingHour.findFirst({
      where: { officeId, dayOfWeek: data.dayOfWeek, effectiveFrom },
    });

    if (existing) {
      return prisma.workingHour.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.workingHour.create({
      data: {
        officeId,
        effectiveFrom,
        ...data,
      },
    });
  }

  // --------------------------------------------------------------- Holidays
  public async findHolidays(companyId: string, filters?: any) {
    const where: any = { companyId };

    if (filters?.officeId) {
      where.officeId = filters.officeId;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.year) {
      const start = new Date(Date.UTC(filters.year, 0, 1));
      const end = new Date(Date.UTC(filters.year + 1, 0, 1));
      where.date = { gte: start, lt: end };
    }

    return prisma.holidayCalendar.findMany({
      where,
      orderBy: { date: "asc" },
    });
  }

  public async findHolidayById(id: string) {
    return prisma.holidayCalendar.findUnique({
      where: { id },
    });
  }

  public async createHoliday(data: any) {
    return prisma.holidayCalendar.create({
      data,
    });
  }

  public async updateHoliday(id: string, data: any) {
    return prisma.holidayCalendar.update({
      where: { id },
      data,
    });
  }

  public async deleteHoliday(id: string) {
    return prisma.holidayCalendar.delete({
      where: { id },
    });
  }
}
