import { SystemRepository } from "../repository/system.repository";
import { NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { cache } from "../../../utils/cache";
import {
  APPLICATION_CATEGORY,
  SETTING_CACHE_TTL,
  settingCacheKey,
  settingCachePattern,
  APPLICATION_CONFIG_CACHE_KEY,
} from "../constants/system.constants";

export class SystemService {
  private repository = new SystemRepository();

  // ---------------------------------------------------------------- Settings
  public async listSettings(companyId: string, query: any) {
    const filters = {
      category: query.category,
      key: query.key,
      isPublic:
        query.isPublic === undefined
          ? undefined
          : query.isPublic === "true" || query.isPublic === true,
    };
    return this.repository.findSettings(companyId, filters);
  }

  public async getSettingByKey(companyId: string, key: string) {
    const cacheKey = settingCacheKey(companyId, key);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const settings = await this.repository.findSettingsByKey(companyId, key);
    if (settings.length === 0) {
      throw new NotFoundError("System setting not found");
    }

    const companyScoped = settings.find((s) => s.companyId === companyId);
    const merged = companyScoped || settings.find((s) => s.companyId === null);

    if (!merged) {
      throw new NotFoundError("System setting not found");
    }

    await cache.set(cacheKey, merged, SETTING_CACHE_TTL);
    return merged;
  }

  public async upsertSetting(companyId: string, key: string, data: any, currentUserId: string) {
    const targetCompanyId = data.global === true ? null : companyId;

    const setting = await this.repository.upsertSetting(
      targetCompanyId,
      key,
      {
        value: data.value,
        type: data.type || "STRING",
        category: data.category || "GENERAL",
        description: data.description ?? null,
        isPublic: data.isPublic ?? false,
        validation: data.validation ?? null,
      },
      currentUserId
    );

    await cache.delete(settingCacheKey(companyId, key));
    await cache.delete(settingCacheKey(null, key));
    await cache.invalidatePattern(settingCachePattern(companyId));

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "SYSTEM_SETTING_CHANGED",
      entityType: "SystemSetting",
      entityId: setting.id,
      entityName: setting.key,
      newValue: setting,
    });

    return setting;
  }

  public async deleteSetting(companyId: string, key: string, currentUserId: string) {
    const setting = await this.repository.findSettingByKey(companyId, key);
    if (!setting) {
      throw new NotFoundError("System setting not found");
    }

    await this.repository.deleteSetting(setting.id);

    await cache.delete(settingCacheKey(companyId, key));
    await cache.invalidatePattern(settingCachePattern(companyId));

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "SYSTEM_SETTING_CHANGED",
      entityType: "SystemSetting",
      entityId: setting.id,
      entityName: setting.key,
      oldValue: setting,
    });

    return { id: setting.id, key: setting.key };
  }

  // -------------------------------------------------------- Application config
  public async getApplicationConfig(companyId: string) {
    const cacheKey = APPLICATION_CONFIG_CACHE_KEY(companyId);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const settings = await this.repository.findSettingsByCategory(companyId, APPLICATION_CATEGORY);

    const config: Record<string, any> = {};
    for (const s of settings) {
      if (s.companyId === null && config[s.key] !== undefined) continue;
      config[s.key] = s.value;
    }

    await cache.set(cacheKey, config, SETTING_CACHE_TTL);
    return config;
  }

  public async updateApplicationConfig(companyId: string, data: any, currentUserId: string) {
    const results = [];
    for (const item of data.settings) {
      const setting = await this.repository.upsertSetting(
        companyId,
        item.key,
        {
          value: item.value,
          type: item.type || "STRING",
          category: APPLICATION_CATEGORY,
          description: item.description ?? null,
          isPublic: item.isPublic ?? false,
        },
        currentUserId
      );
      results.push(setting);
      await cache.delete(settingCacheKey(companyId, item.key));
    }

    await cache.delete(APPLICATION_CONFIG_CACHE_KEY(companyId));
    await cache.invalidatePattern(settingCachePattern(companyId));

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "SYSTEM_SETTING_CHANGED",
      entityType: "SystemSetting",
      entityName: APPLICATION_CATEGORY,
      newValue: results,
    });

    return results;
  }

  // ------------------------------------------------------------ WorkingHours
  public async getWorkingHours(officeId: string) {
    return this.repository.findWorkingHours(officeId);
  }

  public async upsertWorkingHours(officeId: string, data: any, currentUserId: string, companyId: string) {
    const results = [];
    for (const item of data.workingHours) {
      const effectiveFrom = item.effectiveFrom ? new Date(item.effectiveFrom) : new Date();
      const wh = await this.repository.upsertWorkingHour(officeId, effectiveFrom, {
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        breakStart: item.breakStart ?? null,
        breakEnd: item.breakEnd ?? null,
        isWorkingDay: item.isWorkingDay ?? true,
        effectiveUntil: item.effectiveUntil ? new Date(item.effectiveUntil) : null,
      });
      results.push(wh);
    }

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "WORKING_HOURS_UPDATED",
      entityType: "WorkingHour",
      entityId: officeId,
      newValue: results,
    });

    return results;
  }

  // --------------------------------------------------------------- Holidays
  public async listHolidays(companyId: string, query: any) {
    const filters = {
      officeId: query.officeId,
      year: query.year ? parseInt(query.year) : undefined,
      isActive:
        query.isActive === undefined
          ? undefined
          : query.isActive === "true" || query.isActive === true,
    };
    return this.repository.findHolidays(companyId, filters);
  }

  public async createHoliday(companyId: string, data: any, currentUserId: string) {
    const holiday = await this.repository.createHoliday({
      companyId,
      officeId: data.officeId ?? null,
      name: data.name,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
      type: data.type || "PUBLIC",
      isRecurring: data.isRecurring ?? false,
      isActive: data.isActive ?? true,
      createdBy: currentUserId,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "HOLIDAY_CREATED",
      entityType: "HolidayCalendar",
      entityId: holiday.id,
      entityName: holiday.name,
      newValue: holiday,
    });

    return holiday;
  }

  public async updateHoliday(companyId: string, id: string, data: any, currentUserId: string) {
    const existing = await this.repository.findHolidayById(id);
    if (!existing || existing.companyId !== companyId) {
      throw new NotFoundError("Holiday not found");
    }

    const updateData: any = {};
    if (data.officeId !== undefined) updateData.officeId = data.officeId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const holiday = await this.repository.updateHoliday(id, updateData);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "HOLIDAY_UPDATED",
      entityType: "HolidayCalendar",
      entityId: holiday.id,
      entityName: holiday.name,
      oldValue: existing,
      newValue: holiday,
    });

    return holiday;
  }

  public async deleteHoliday(companyId: string, id: string, currentUserId: string) {
    const existing = await this.repository.findHolidayById(id);
    if (!existing || existing.companyId !== companyId) {
      throw new NotFoundError("Holiday not found");
    }

    await this.repository.deleteHoliday(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "HOLIDAY_DELETED",
      entityType: "HolidayCalendar",
      entityId: id,
      entityName: existing.name,
      oldValue: existing,
    });

    return { id };
  }
}
