import { ReportsRepository } from "../repository/reports.repository";
import { ReportFilter, ReportResult, ReportDataSource, ReportDefinitionInput } from "../types/reports.types";
import { REPORT_COLUMNS_BY_SOURCE } from "../constants/reports.constants";
import { REPORT_ACTIONS, REPORT_NOTIFICATION_TYPE } from "../constants/reports.constants";
import { NotFoundError, BadRequestError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { prisma } from "../../../config/prisma";

export class ReportsService {
  private repository = new ReportsRepository();

  public parseFilters(query: any): ReportFilter {
    return {
      status: query.status,
      categoryId: query.categoryId,
      departmentId: query.departmentId,
      officeId: query.officeId,
      condition: query.condition,
      priority: query.priority,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };
  }

  // ---------------------------------------------------------------------------
  // Report builders -> ReportResult (rows + summary + columns)
  // ---------------------------------------------------------------------------

  public async buildAssetReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getAssetReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.asset };
  }

  public async buildMaintenanceReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getMaintenanceReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.maintenance };
  }

  public async buildAuditReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getAuditReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.audit };
  }

  public async buildDepartmentReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getDepartmentReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.department };
  }

  public async buildEmployeeReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getEmployeeReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.employee };
  }

  public async buildAllocationReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getAllocationReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.allocation };
  }

  public async buildUtilizationReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getUtilizationReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.utilization };
  }

  public async buildBookingReport(companyId: string, filters: ReportFilter): Promise<ReportResult> {
    const { rows, summary } = await this.repository.getBookingReport(companyId, filters);
    return { rows, summary, columns: REPORT_COLUMNS_BY_SOURCE.booking };
  }

  public async buildBySource(
    dataSource: ReportDataSource,
    companyId: string,
    filters: ReportFilter
  ): Promise<ReportResult> {
    const { rows, summary } = await this.repository.buildDataSource(
      dataSource,
      companyId,
      filters
    );
    return {
      rows,
      summary,
      columns: REPORT_COLUMNS_BY_SOURCE[dataSource],
    };
  }

  // ---------------------------------------------------------------------------
  // Metadata CRUD
  // ---------------------------------------------------------------------------

  public async createMetadata(
    input: ReportDefinitionInput,
    currentUserId: string,
    companyId: string
  ) {
    const created = await this.repository.createMetadata(
      {
        name: input.name,
        description: input.description || null,
        category: input.category,
        reportType: input.reportType,
        dataSource: input.dataSource || null,
        filters: input.filters || null,
        columns: input.columns || null,
        groupBy: input.groupBy || null,
        sortBy: input.sortBy || null,
        chartConfig: input.chartConfig || null,
        isPublic: input.isPublic || false,
        isScheduled: input.isScheduled || false,
        scheduleConfig: input.scheduleConfig || null,
        companyId,
      },
      currentUserId
    );

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: REPORT_ACTIONS.METADATA_CREATED,
      entityType: "ReportMetadata",
      entityId: created.id,
      entityName: created.name,
      newValue: created,
    });

    return created;
  }

  public async listMetadata(companyId: string, query: any) {
    return this.repository.listMetadata(companyId, query);
  }

  public async getMetadata(id: string) {
    const meta = await this.repository.getMetadataById(id);
    if (!meta) {
      throw new NotFoundError("Report definition not found");
    }
    return meta;
  }

  public async updateMetadata(
    id: string,
    input: Partial<ReportDefinitionInput>,
    currentUserId: string,
    companyId: string
  ) {
    const existing = await this.repository.getMetadataById(id);
    if (!existing) {
      throw new NotFoundError("Report definition not found");
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = input.category;
    if (input.reportType !== undefined) data.reportType = input.reportType;
    if (input.dataSource !== undefined) data.dataSource = input.dataSource;
    if (input.filters !== undefined) data.filters = input.filters;
    if (input.columns !== undefined) data.columns = input.columns;
    if (input.groupBy !== undefined) data.groupBy = input.groupBy;
    if (input.sortBy !== undefined) data.sortBy = input.sortBy;
    if (input.chartConfig !== undefined) data.chartConfig = input.chartConfig;
    if (input.isPublic !== undefined) data.isPublic = input.isPublic;
    if (input.isScheduled !== undefined) data.isScheduled = input.isScheduled;
    if (input.scheduleConfig !== undefined) data.scheduleConfig = input.scheduleConfig;

    const updated = await this.repository.updateMetadata(id, data);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: REPORT_ACTIONS.METADATA_UPDATED,
      entityType: "ReportMetadata",
      entityId: id,
      entityName: updated.name,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  public async deleteMetadata(id: string, currentUserId: string, companyId: string) {
    const existing = await this.repository.getMetadataById(id);
    if (!existing) {
      throw new NotFoundError("Report definition not found");
    }
    await this.repository.softDeleteMetadata(id);
    return { id, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // Generate Report from saved definition (wrapped in a transaction)
  // ---------------------------------------------------------------------------

  public async generateReport(id: string, currentUserId: string, companyId: string) {
    const definition = await this.repository.getMetadataForGenerate(id, companyId);
    if (!definition) {
      throw new NotFoundError("Report definition not found");
    }

    if (!definition.dataSource) {
      throw new BadRequestError("Report definition has no data source configured");
    }

    const dataSource = definition.dataSource as ReportDataSource;
    const filters = (definition.filters as ReportFilter) || {};

    const result = await prisma.$transaction(async (tx) => {
      const generated = await this.repository.buildDataSource(
        dataSource,
        companyId,
        filters
      );
      await this.repository.markGenerated(id, tx);
      return generated;
    });

    let columns = REPORT_COLUMNS_BY_SOURCE[dataSource];
    if (definition.columns && Array.isArray(definition.columns) && definition.columns.length) {
      columns = definition.columns.map((c: any) => ({
        key: c.key,
        header: c.header || c.key,
      }));
    }

    const reportResult: ReportResult = {
      rows: result.rows,
      summary: result.summary,
      columns,
    };

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: REPORT_ACTIONS.GENERATED,
      entityType: "ReportMetadata",
      entityId: id,
      entityName: definition.name,
      newValue: { rowCount: result.rows.length },
    });

    if (definition.createdBy && definition.createdBy !== currentUserId) {
      await NotificationTrigger.create({
        userId: definition.createdBy,
        title: "Report ready",
        message: `Your report "${definition.name}" has been generated.`,
        type: REPORT_NOTIFICATION_TYPE,
        entityType: "ReportMetadata",
        entityId: id,
        priority: "MEDIUM" as any,
      });
    }

    return { ...reportResult, definition: { id: definition.id, name: definition.name } };
  }
}
