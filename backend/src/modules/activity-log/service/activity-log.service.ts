import { ActivityLogRepository } from "../repository/activity-log.repository";
import { NotFoundError } from "../../../errors/app-error";
import { ExportUtil, ExportColumn } from "../../../utils/export";

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "createdAt", header: "Created At", format: (v) => (v ? new Date(v).toISOString() : "") },
  { key: "action", header: "Action" },
  { key: "entityType", header: "Entity Type" },
  { key: "entityName", header: "Entity Name" },
  { key: "userId", header: "User ID" },
  { key: "status", header: "Status" },
];

export class ActivityLogService {
  private repository = new ActivityLogRepository();

  public async createActivityLog(data: any, companyId: string) {
    const company = data.companyId || companyId;

    const log = await this.repository.create({
      companyId: company,
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      entityName: data.entityName ?? null,
      oldValue: data.oldValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      deviceInfo: data.deviceInfo,
      requestId: data.requestId ?? null,
      durationMs: data.durationMs ?? null,
      status: data.status || "SUCCESS",
      errorMessage: data.errorMessage ?? null,
      metadata: data.metadata,
    });

    return log;
  }

  public async listActivities(companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters: any = {
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      userId: query.userId,
      status: query.status,
      search: query.search,
    };

    if (query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
    if (query.dateTo) filters.dateTo = new Date(query.dateTo);

    const { logs, total } = await this.repository.findManyForCompany(
      companyId,
      filters,
      page,
      limit
    );

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getById(id: string, companyId: string) {
    const log = await this.repository.findById(id, companyId);
    if (!log) {
      throw new NotFoundError("Activity log not found");
    }
    return log;
  }

  public async getUserActivity(userId: string, companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters: any = {
      action: query.action,
      status: query.status,
    };
    if (query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
    if (query.dateTo) filters.dateTo = new Date(query.dateTo);

    const { logs, total } = await this.repository.findByUser(userId, companyId, filters, page, limit);
    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async getEntityActivity(entityType: string, entityId: string, companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const { logs, total } = await this.repository.findByEntity(entityType, entityId, companyId, page, limit);
    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async getAuditActivity(entityId: string, companyId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const { logs, total } = await this.repository.findAuditByEntityId(entityId, companyId, page, limit);
    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  public async exportActivities(companyId: string, query: any) {
    const filters: any = {
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      userId: query.userId,
      status: query.status,
      search: query.search,
    };
    if (query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
    if (query.dateTo) filters.dateTo = new Date(query.dateTo);

    const { logs } = await this.repository.findManyForCompany(companyId, filters, 1, 100000, false);

    const type = ExportUtil.parseType(query.export);
    const result = await ExportUtil.generate(logs, EXPORT_COLUMNS, type, "Activity Logs");

    return { result, type };
  }
}
