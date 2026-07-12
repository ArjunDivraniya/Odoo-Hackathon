import { Response, NextFunction } from "express";
import { ActivityLogService } from "../service/activity-log.service";
import { AuthenticatedRequest } from "../../../types";

export class ActivityLogController {
  private service = new ActivityLogService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createActivityLog(
        { ...req.body, userId: req.body.userId ?? currentUserId },
        companyId
      );
      res.status(201).json({
        success: true,
        message: "Activity log created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listActivities(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Activity logs fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const companyId = req.user!.companyId;
      const result = await this.service.getById(id, companyId);
      res.status(200).json({
        success: true,
        message: "Activity log fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const companyId = req.user!.companyId;
      const result = await this.service.getUserActivity(userId, companyId, req.query);
      res.status(200).json({
        success: true,
        message: "User activity logs fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getEntityActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const companyId = req.user!.companyId;
      const result = await this.service.getEntityActivity(entityType, entityId, companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Entity activity logs fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAuditActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entityId = req.params.entityId as string;
      const companyId = req.user!.companyId;
      const result = await this.service.getAuditActivity(entityId, companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Audit activity logs fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public export = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const { result, type } = await this.service.exportActivities(companyId, req.query);

      const content = result.content as Buffer | string;
      res.setHeader("Content-Type", result.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="activity-logs.${result.extension}"`
      );

      if (type === "JSON" || type === "CSV") {
        res.status(200).send(content.toString());
      } else {
        res.status(200).send(Buffer.from(content));
      }
    } catch (error) {
      next(error);
    }
  };
}
