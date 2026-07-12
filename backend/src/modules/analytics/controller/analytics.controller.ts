import { Response, NextFunction } from "express";
import { AnalyticsService } from "../service/analytics.service";
import { AuthenticatedRequest } from "../../../types";
import { ExportUtil } from "../../../utils/export";

export class AnalyticsController {
  private service = new AnalyticsService();

  private async respond(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
    result: any,
    title: string,
    message: string
  ): Promise<void> {
    try {
      if (req.query.export) {
        const rows = result.rows || [];
        const columns = result.columns || [{ key: "key", header: "Key" }, { key: "count", header: "Count" }];
        const exportResult = await ExportUtil.generate(
          rows,
          columns,
          ExportUtil.parseType(req.query.export as string),
          title
        );
        res.setHeader("Content-Type", exportResult.contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${title}.${exportResult.extension}"`
        );
        res.status(200).send(exportResult.content);
        return;
      }
      res.status(200).json({ success: true, message, data: result });
    } catch (error) {
      next(error);
    }
  }

  public assetUtilization = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getAssetUtilization(companyId);
      await this.respond(req, res, next, result, "Asset_Utilization", "Asset utilization analytics fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public mostUsedAssets = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getMostUsedAssets(companyId);
      await this.respond(req, res, next, result, "Most_Used_Assets", "Most used assets fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public idleAssets = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const idleDays = req.query.idleDays ? Number(req.query.idleDays) : 90;
      const result = await this.service.getIdleAssets(companyId, idleDays);
      await this.respond(req, res, next, result, "Idle_Assets", "Idle assets fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public maintenanceTrends = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const year = req.query.year ? Number(req.query.year) : undefined;
      let from: Date | undefined;
      let to: Date | undefined;
      if (req.query.from) from = new Date(req.query.from as string);
      if (req.query.to) to = new Date(req.query.to as string);
      if (year && !from && !to) {
        from = new Date(Date.UTC(year, 0, 1));
        to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      }
      const result = await this.service.getMaintenanceTrends(companyId, year, from, to);
      await this.respond(req, res, next, result, "Maintenance_Trends", "Maintenance trends fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public department = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getDepartmentAnalytics(companyId);
      await this.respond(req, res, next, result, "Department_Analytics", "Department analytics fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public monthly = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();
      const result = await this.service.getMonthlyReport(companyId, year);
      await this.respond(req, res, next, result, "Monthly_Report", "Monthly report fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public yearly = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getYearlyReport(companyId);
      await this.respond(req, res, next, result, "Yearly_Report", "Yearly report fetched successfully");
    } catch (error) {
      next(error);
    }
  };

  public custom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getCustomAnalytics(companyId, req.query);
      await this.respond(req, res, next, result, "Custom_Analytics", "Custom analytics fetched successfully");
    } catch (error) {
      next(error);
    }
  };
}
