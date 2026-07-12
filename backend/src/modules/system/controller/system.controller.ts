import { Response, NextFunction } from "express";
import { SystemService } from "../service/system.service";
import { AuthenticatedRequest } from "../../../types";

export class SystemController {
  private service = new SystemService();

  public listSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listSettings(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "System settings fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const key = req.params.key as string;
      const result = await this.service.getSettingByKey(companyId, key);
      res.status(200).json({
        success: true,
        message: "System setting fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public upsertSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const key = req.params.key as string;
      const result = await this.service.upsertSetting(companyId, key, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "System setting saved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const key = req.params.key as string;
      const result = await this.service.deleteSetting(companyId, key, currentUserId);
      res.status(200).json({
        success: true,
        message: "System setting deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getApplicationConfig = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getApplicationConfig(companyId);
      res.status(200).json({
        success: true,
        message: "Application configuration fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateApplicationConfig = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const result = await this.service.updateApplicationConfig(companyId, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Application configuration updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getWorkingHours = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const officeId = req.params.officeId as string;
      const result = await this.service.getWorkingHours(officeId);
      res.status(200).json({
        success: true,
        message: "Working hours fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateWorkingHours = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const officeId = req.params.officeId as string;
      const result = await this.service.upsertWorkingHours(officeId, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Working hours updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listHolidays = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listHolidays(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Holidays fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public createHoliday = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const result = await this.service.createHoliday(companyId, req.body, currentUserId);
      res.status(201).json({
        success: true,
        message: "Holiday created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateHoliday = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.updateHoliday(companyId, id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Holiday updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteHoliday = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.deleteHoliday(companyId, id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Holiday deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
