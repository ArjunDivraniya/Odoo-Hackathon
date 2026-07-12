import { Response, NextFunction } from "express";
import { AuditService } from "../service/audit.service";
import { AuthenticatedRequest } from "../../../types";
import { ExportUtil } from "../../../utils/export";

const EXPORT_COLUMNS = [
  { key: "assetTag", header: "Asset Tag" },
  { key: "discrepancyType", header: "Discrepancy Type" },
  { key: "severity", header: "Severity" },
  { key: "status", header: "Status" },
  { key: "description", header: "Description" },
  { key: "assignedTo", header: "Assigned To" },
];

export class AuditController {
  private service = new AuditService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createCycle(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Audit cycle created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listCycles(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Audit cycles fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public search = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.searchCycles(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Audit cycles search completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getCycle(id);
      res.status(200).json({
        success: true,
        message: "Audit cycle fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.updateCycle(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Audit cycle updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public assign = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cycleId = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.assignAuditor(cycleId, req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Auditor assigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public start = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignmentId = req.params.assignmentId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.startAudit(assignmentId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Audit started successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public submitResult = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignmentId = req.params.assignmentId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.submitResult(assignmentId, req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Audit result submitted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyResult = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultId = req.params.resultId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.verifyResult(resultId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset verified successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public markMissing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultId = req.params.resultId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.markMissing(resultId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset marked as missing successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public markDamaged = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultId = req.params.resultId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.markDamaged(resultId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset marked as damaged successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public discrepancyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cycleId = req.params.id as string;
      const result = await this.service.getDiscrepancyReport(cycleId);
      const exportType = ExportUtil.parseType(req.query.export as string | undefined);

      if (exportType && req.query.export) {
        const exported = await ExportUtil.generate(result.rows, EXPORT_COLUMNS, exportType, "Discrepancy Report");
        res.setHeader("Content-Type", exported.contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="discrepancy-report-${cycleId}.${exported.extension}"`
        );
        res.status(200).send(exported.content);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Discrepancy report generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public close = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cycleId = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.closeAudit(cycleId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Audit cycle closed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public history = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cycleId = req.params.id as string;
      const result = await this.service.getHistory(cycleId);
      res.status(200).json({
        success: true,
        message: "Audit history fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public dashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cycleId = req.params.id as string;
      const result = await this.service.getDashboard(cycleId);
      res.status(200).json({
        success: true,
        message: "Audit dashboard fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
