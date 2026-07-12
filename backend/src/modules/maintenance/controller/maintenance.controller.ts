import { Response, NextFunction } from "express";
import { MaintenanceService } from "../service/maintenance.service";
import { AuthenticatedRequest } from "../../../types";
import { NotFoundError } from "../../../errors/app-error";

export class MaintenanceController {
  private service = new MaintenanceService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createMaintenance(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Maintenance request created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listMaintenance(companyId, req.query as any);
      res.status(200).json({
        success: true,
        message: "Maintenance requests fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getMaintenanceById(id);
      res.status(200).json({
        success: true,
        message: "Maintenance request fetched successfully",
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
      const result = await this.service.updateMaintenance(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Maintenance request updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.approveMaintenance(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Maintenance request approved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public reject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const { rejectionReason } = req.body;
      const result = await this.service.rejectMaintenance(id, rejectionReason, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Maintenance request rejected successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public assignTechnician = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.assignTechnician(id, req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Technician assigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const { status, reason } = req.body;
      const result = await this.service.updateStatus(id, status, reason, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Maintenance status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public complete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.completeMaintenance(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Maintenance request completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTimeline = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getTimeline(id);
      res.status(200).json({
        success: true,
        message: "Maintenance timeline fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public addAttachment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.addAttachment(id, req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Attachment added successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listAttachments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.listAttachments(id);
      res.status(200).json({
        success: true,
        message: "Attachments fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteAttachment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const attachmentId = req.params.attachmentId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.deleteAttachment(id, attachmentId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Attachment deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getHistory(id);
      res.status(200).json({
        success: true,
        message: "Maintenance history fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public search = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.searchMaintenance(companyId, req.query as any);
      res.status(200).json({
        success: true,
        message: "Maintenance search completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getFilterOptions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getFilterOptions();
      res.status(200).json({
        success: true,
        message: "Filter options fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
