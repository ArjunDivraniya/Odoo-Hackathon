import { DashboardRepository } from "../repository/dashboard.repository";
import { cache } from "../../../utils/cache";

const CACHE_TTL = 120;

export class DashboardService {
  private repository = new DashboardRepository();

  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = await cache.get(key);
    if (hit !== null && hit !== undefined) {
      return hit as T;
    }
    const value = await fn();
    await cache.set(key, value, CACHE_TTL);
    return value;
  }

  public getSummary(companyId: string) {
    return this.cached(`dash:summary:${companyId}`, () =>
      this.repository.getSummary(companyId)
    );
  }

  public getKpi(companyId: string) {
    return this.cached(`dash:kpi:${companyId}`, () =>
      this.repository.getKpi(companyId)
    );
  }

  public getAssetsOverview(companyId: string) {
    return this.cached(`dash:assets-overview:${companyId}`, () =>
      this.repository.getAssetsOverview(companyId)
    );
  }

  public getMaintenanceOverview(companyId: string) {
    return this.cached(`dash:maintenance-overview:${companyId}`, () =>
      this.repository.getMaintenanceOverview(companyId)
    );
  }

  public getAuditOverview(companyId: string) {
    return this.cached(`dash:audit-overview:${companyId}`, () =>
      this.repository.getAuditOverview(companyId)
    );
  }

  public getBookingOverview(companyId: string) {
    return this.cached(`dash:booking-overview:${companyId}`, () =>
      this.repository.getBookingOverview(companyId)
    );
  }

  public getDepartmentOverview(companyId: string) {
    return this.cached(`dash:department-overview:${companyId}`, () =>
      this.repository.getDepartmentOverview(companyId)
    );
  }

  public getRecentActivities(companyId: string, limit = 10) {
    return this.repository.getRecentActivities(companyId, limit);
  }

  public getUpcomingTasks(companyId: string) {
    return this.repository.getUpcomingTasks(companyId);
  }

  public getOverdueItems(companyId: string) {
    return this.repository.getOverdueItems(companyId);
  }

  public getChartsData(companyId: string) {
    return this.cached(`dash:charts:${companyId}`, async () => {
      const [assets, maintenance, audit] = await Promise.all([
        this.repository.getAssetsOverview(companyId),
        this.repository.getMaintenanceOverview(companyId),
        this.repository.getAuditOverview(companyId),
      ]);
      return {
        assetStatusPie: assets.byStatus,
        maintenanceTrend: maintenance.trend,
        auditProgress: audit.byStatus,
      };
    });
  }

  public getWidgets(userId: string) {
    return this.repository.getWidgets(userId);
  }

  public createWidget(data: any) {
    return this.repository.createWidget(data);
  }

  public updateWidget(id: string, userId: string, data: any) {
    return this.repository.updateWidget(id, userId, data);
  }

  public deleteWidget(id: string, userId: string) {
    return this.repository.deleteWidget(id, userId);
  }
}
