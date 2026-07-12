import { Response, NextFunction } from "express";
import { ReportsService } from "../service/reports.service";
import { AuthenticatedRequest } from "../../../types";
import { NotFoundError } from "../../../errors/app-error";
import { ReportDataSource } from "../types/reports.types";
import { ExportUtil } from "../../../utils/export";

export class ReportsController {
  private service = new ReportsService();

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
        const exportResult = await ExportUtil.generate(
          result.rows,
          result.columns,
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

  public assets = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildAssetReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Asset_Report", "Asset report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public maintenance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildMaintenanceReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Maintenance_Report", "Maintenance report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public audits = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildAuditReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Audit_Report", "Audit report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public departments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildDepartmentReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Department_Report", "Department report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public employees = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildEmployeeReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Employee_Report", "Employee report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public allocations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildAllocationReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Allocation_Report", "Allocation report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public utilization = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildUtilizationReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Utilization_Report", "Utilization report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public bookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.buildBookingReport(
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, "Booking_Report", "Booking report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public createMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const created = await this.service.createMetadata(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Report definition saved successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  public listMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listMetadata(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Report definitions fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const meta = await this.service.getMetadata(id);
      res.status(200).json({
        success: true,
        message: "Report definition fetched successfully",
        data: meta,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const updated = await this.service.updateMetadata(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Report definition updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteMetadata = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.deleteMetadata(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Report definition deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.generateReport(id, currentUserId, companyId);
      await this.respond(req, res, next, result, `Report_${id}`, "Report generated successfully");
    } catch (error) {
      next(error);
    }
  };

  public exportGeneric = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const type = req.query.type as ReportDataSource;
      const result = await this.service.buildBySource(
        type,
        companyId,
        this.service.parseFilters(req.query)
      );
      await this.respond(req, res, next, result, `Export_${type}`, "Export generated successfully");
    } catch (error) {
      next(error);
    }
  };
}
