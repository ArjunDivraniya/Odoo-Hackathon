import { Response, NextFunction } from "express";
import { EmailService } from "../service/email.service";
import { AuthenticatedRequest } from "../../../types";

export class EmailController {
  private service = new EmailService();

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.listTemplates(req.query);
      res.status(200).json({
        success: true,
        message: "Email templates fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getTemplateById(id);
      res.status(200).json({
        success: true,
        message: "Email template fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const result = await this.service.createTemplate(companyId, req.body, currentUserId);
      res.status(201).json({
        success: true,
        message: "Email template created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.updateTemplate(companyId, id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Email template updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.deleteTemplate(companyId, id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Email template deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public preview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.previewTemplate(id, req.body.data || {});
      res.status(200).json({
        success: true,
        message: "Email template preview rendered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public send = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const result = await this.service.sendTemplateEmail(companyId, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Email sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
