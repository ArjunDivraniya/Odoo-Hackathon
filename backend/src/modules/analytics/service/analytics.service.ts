import { AnalyticsRepository } from "../repository/analytics.repository";
import { cache } from "../../../utils/cache";
import { BadRequestError } from "../../../errors/app-error";
import {
  analyticsCacheTtl,
  ASSET_UTILIZATION_COLUMNS,
  MOST_USED_ASSETS_COLUMNS,
  IDLE_ASSETS_COLUMNS,
  MAINTENANCE_TRENDS_COLUMNS,
  DEPARTMENT_ANALYTICS_COLUMNS,
  MONTHLY_REPORT_COLUMNS,
  YEARLY_REPORT_COLUMNS,
} from "../constants/analytics.constants";
import { ExportUtil } from "../../../utils/export";

export class AnalyticsService {
  private repository = new AnalyticsRepository();

  private async cached<T>(key: string, builder: () => Promise<T>): Promise<T> {
    const cached = await cache.get(key);
    if (cached !== null && cached !== undefined) {
      return cached as T;
    }
    const data = await builder();
    await cache.set(key, data, analyticsCacheTtl);
    return data;
  }

  public async getAssetUtilization(companyId: string) {
    const key = `analytics:utilization:${companyId}`;
    const data = await this.cached(key, () => this.repository.getAssetUtilization(companyId));
    return { ...data, columns: ASSET_UTILIZATION_COLUMNS };
  }

  public async getMostUsedAssets(companyId: string) {
    const key = `analytics:most-used:${companyId}`;
    const rows = await this.cached(key, () => this.repository.getMostUsedAssets(companyId));
    return { rows, columns: MOST_USED_ASSETS_COLUMNS };
  }

  public async getIdleAssets(companyId: string, idleDays: number) {
    const key = `analytics:idle:${companyId}:${idleDays}`;
    const rows = await this.cached(key, () =>
      this.repository.getIdleAssets(companyId, idleDays)
    );
    return { rows, idleDays, columns: IDLE_ASSETS_COLUMNS };
  }

  public async getMaintenanceTrends(companyId: string, year?: number, from?: Date, to?: Date) {
    const rangeKey = year ? String(year) : `${from?.toISOString() || "0"}_${to?.toISOString() || "9"}`;
    const key = `analytics:maintenance-trends:${companyId}:${rangeKey}`;
    const rows = await this.cached(key, () =>
      this.repository.getMaintenanceTrends(companyId, from, to)
    );
    return { rows, columns: MAINTENANCE_TRENDS_COLUMNS };
  }

  public async getDepartmentAnalytics(companyId: string) {
    const key = `analytics:department:${companyId}`;
    const rows = await this.cached(key, () => this.repository.getDepartmentAnalytics(companyId));
    return { rows, columns: DEPARTMENT_ANALYTICS_COLUMNS };
  }

  public async getMonthlyReport(companyId: string, year: number) {
    const key = `analytics:monthly:${companyId}:${year}`;
    const rows = await this.cached(key, () => this.repository.getMonthlyReport(companyId, year));
    return { rows, year, columns: MONTHLY_REPORT_COLUMNS };
  }

  public async getYearlyReport(companyId: string) {
    const key = `analytics:yearly:${companyId}`;
    const rows = await this.cached(key, () => this.repository.getYearlyReport(companyId));
    return { rows, columns: YEARLY_REPORT_COLUMNS };
  }

  public async getCustomAnalytics(companyId: string, query: any) {
    if (!query.groupBy) {
      throw new BadRequestError("groupBy parameter is required for custom analytics");
    }
    const rows = await this.repository.getCustomAnalytics(companyId, query);
    return {
      rows,
      groupBy: query.groupBy,
      metric: query.metric || "count",
      columns: [
        { key: "key", header: query.groupBy },
        { key: "count", header: "Count" },
      ],
    };
  }
}
