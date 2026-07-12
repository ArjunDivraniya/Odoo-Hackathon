export const SETTING_TYPES = ["STRING", "NUMBER", "BOOLEAN", "JSON", "DATE"] as const;

export const SETTING_CATEGORIES = ["GENERAL", "APPLICATION", "SECURITY", "NOTIFICATION", "BOOKING"] as const;

export const HOLIDAY_TYPES = ["PUBLIC", "COMPANY", "OPTIONAL", "RELIGIOUS"] as const;

export const APPLICATION_CATEGORY = "APPLICATION";

export const SETTING_CACHE_TTL = 300;

export const settingCacheKey = (companyId: string | null, key: string): string =>
  `sys:setting:${companyId ?? "global"}:${key}`;

export const settingCachePattern = (companyId: string | null): string =>
  `sys:setting:${companyId ?? "global"}:*`;

export const APPLICATION_CONFIG_CACHE_KEY = (companyId: string | null): string =>
  `sys:appconfig:${companyId ?? "global"}`;
