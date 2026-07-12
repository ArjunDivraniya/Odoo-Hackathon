import { Response, NextFunction } from "express";
import { NotificationService } from "../service/notification.service";
import { AuthenticatedRequest } from "../../../types";
import { NotFoundError } from "../../../errors/app-error";

export class NotificationController {
  private service = new NotificationService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createNotification(req.body, companyId, currentUserId);
      res.status(201).json({
        success: true,
        message: result.skipped
          ? "Notification skipped due to user preferences"
          : "Notification created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const result = await this.service.getNotifications(currentUserId, req.query);
      res.status(200).json({
        success: true,
        message: "Notifications fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public unreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const result = await this.service.getUnreadCount(currentUserId);
      res.status(200).json({
        success: true,
        message: "Unread count fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public markRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const result = await this.service.markRead(id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const result = await this.service.markAllRead(currentUserId);
      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const result = await this.service.deleteNotification(id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const result = await this.service.getPreferences(currentUserId);
      res.status(200).json({
        success: true,
        message: "Notification preferences fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updatePreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const result = await this.service.updatePreferences(currentUserId, req.body);
      res.status(200).json({
        success: true,
        message: "Notification preferences updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public templates = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getTemplates();
      res.status(200).json({
        success: true,
        message: "Notification templates fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public sendEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.sendEmailNotification(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Email notification sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public sendInApp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.sendInApp(req.body, companyId, currentUserId);
      res.status(201).json({
        success: true,
        message: result.skipped
          ? "In-app notification skipped due to user preferences"
          : "In-app notification sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
