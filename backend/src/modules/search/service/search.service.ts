import { SearchRepository } from "../repository/search.repository";
import { cache } from "../../../utils/cache";
import {
  SearchEntityType,
  SearchResultItem,
  SuggestResultItem,
  GlobalSearchResults,
  GlobalFilterDimensions,
} from "../types/search.types";
import {
  ALL_SEARCH_TYPES,
  SEARCH_RESULT_LIMIT,
  SEARCH_CACHE_TTL,
  DATE_RANGE_PRESETS,
} from "../constants/search.constants";
import { AssetStatus, MaintenanceStatus, AuditStatus, NotificationStatus, PriorityLevel } from "@prisma/client";

export class SearchService {
  private repository = new SearchRepository();

  private parseTypes(types?: string): SearchEntityType[] {
    if (!types || types.trim() === "") return [...ALL_SEARCH_TYPES];
    const requested = types.split(",").map((t) => t.trim().toLowerCase()) as SearchEntityType[];
    const valid = requested.filter((t) => (ALL_SEARCH_TYPES as string[]).includes(t));
    return valid.length > 0 ? valid : [...ALL_SEARCH_TYPES];
  }

  private emptyResults(types: SearchEntityType[]): GlobalSearchResults {
    const result = {} as GlobalSearchResults;
    for (const t of types) result[t] = [];
    return result;
  }

  public async globalSearch(
    types: string | undefined,
    q: string | undefined,
    limit: number | undefined,
    companyId: string,
    userId: string
  ): Promise<GlobalSearchResults> {
    const requestedTypes = this.parseTypes(types);
    const perTypeLimit = limit && limit > 0 ? limit : SEARCH_RESULT_LIMIT;
    const query = q && q.trim() !== "" ? q.trim() : "";

    if (!query) return this.emptyResults(requestedTypes);

    const cacheKey = `search:${companyId}:${query}:${requestedTypes.join(",")}:${perTypeLimit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached as GlobalSearchResults;

    const results = this.emptyResults(requestedTypes);

    await Promise.all(
      requestedTypes.map(async (type) => {
        results[type] = await this.searchByType(type, query, perTypeLimit, companyId, userId);
      })
    );

    await cache.set(cacheKey, results, SEARCH_CACHE_TTL);
    return results;
  }

  public async suggest(
    types: string | undefined,
    q: string | undefined,
    limit: number | undefined,
    companyId: string,
    userId: string
  ): Promise<SuggestResultItem[]> {
    const requestedTypes = this.parseTypes(types);
    const perTypeLimit = limit && limit > 0 ? limit : SEARCH_RESULT_LIMIT;
    const query = q && q.trim() !== "" ? q.trim() : "";

    if (!query) return [];

    const cacheKey = `suggest:${companyId}:${query}:${requestedTypes.join(",")}:${perTypeLimit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached as SuggestResultItem[];

    const collected: SuggestResultItem[] = [];

    await Promise.all(
      requestedTypes.map(async (type) => {
        const items = await this.searchByType(type, query, perTypeLimit, companyId, userId);
        for (const item of items) {
          collected.push({ type: item.type, id: item.id, label: item.title });
        }
      })
    );

    await cache.set(cacheKey, collected, SEARCH_CACHE_TTL);
    return collected;
  }

  private async searchByType(
    type: SearchEntityType,
    q: string,
    limit: number,
    companyId: string,
    userId: string
  ): Promise<SearchResultItem[]> {
    switch (type) {
      case "asset":
        return (await this.repository.searchAssets(companyId, q, limit)).map((a: any) => ({
          type: "asset",
          id: a.id,
          title: a.name,
          subtitle: a.assetTag,
          url: `/assets/${a.id}`,
        }));
      case "employee":
        return (await this.repository.searchEmployees(companyId, q, limit)).map((e: any) => ({
          type: "employee",
          id: e.id,
          title: [e.user?.firstName, e.user?.lastName].filter(Boolean).join(" ").trim() || e.employeeId,
          subtitle: e.employeeId,
          url: `/employees/${e.id}`,
        }));
      case "department":
        return (await this.repository.searchDepartments(companyId, q, limit)).map((d: any) => ({
          type: "department",
          id: d.id,
          title: d.name,
          subtitle: d.code,
          url: `/departments/${d.id}`,
        }));
      case "maintenance":
        return (await this.repository.searchMaintenance(companyId, q, limit)).map((m: any) => ({
          type: "maintenance",
          id: m.id,
          title: m.title,
          subtitle: m.status,
          url: `/maintenance/${m.id}`,
        }));
      case "audit":
        return (await this.repository.searchAudit(companyId, q, limit)).map((a: any) => ({
          type: "audit",
          id: a.id,
          title: a.name,
          subtitle: a.frequency,
          url: `/audits/${a.id}`,
        }));
      case "notification":
        return (await this.repository.searchNotifications(userId, q, limit)).map((n: any) => ({
          type: "notification",
          id: n.id,
          title: n.title,
          subtitle: n.message,
          url: n.actionUrl || `/notifications/${n.id}`,
        }));
      case "report":
        return (await this.repository.searchReports(companyId, q, limit)).map((r: any) => ({
          type: "report",
          id: r.id,
          title: r.name,
          subtitle: r.category,
          url: `/reports/${r.id}`,
        }));
      case "file":
        return (await this.repository.searchFiles(companyId, q, limit)).map((f: any) => ({
          type: "file",
          id: f.id,
          title: f.originalName,
          subtitle: f.mimeType,
          url: `/files/${f.id}`,
        }));
      default:
        return [];
    }
  }

  public async globalFilters(companyId: string): Promise<GlobalFilterDimensions> {
    const dimensions = await this.repository.fetchFilterDimensions(companyId);

    return {
      statuses: {
        asset: Object.values(AssetStatus),
        maintenance: Object.values(MaintenanceStatus),
        audit: Object.values(AuditStatus),
        notification: Object.values(NotificationStatus),
      },
      priorities: Object.values(PriorityLevel),
      departments: dimensions.departments,
      users: dimensions.users,
      technicians: dimensions.technicians,
      auditCycles: dimensions.auditCycles,
      notificationTypes: dimensions.notificationTypes,
      dateRangePresets: DATE_RANGE_PRESETS,
    };
  }

  public async logSearch(companyId: string, userId: string, payload: { q?: string; types?: string }) {
    await this.repository.logSearch(companyId, userId, payload);
    return { logged: true };
  }
}
