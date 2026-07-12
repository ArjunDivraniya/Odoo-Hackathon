import { Response, NextFunction } from "express";
import { LookupService } from "../service/lookup.service";
import { AuthenticatedRequest } from "../../../types";

export class LookupController {
  private service = new LookupService();

  public listLookups = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listLookups(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Lookups fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listByCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const category = req.params.category as string;
      const result = await this.service.listLookupsByCategory(companyId, category);
      res.status(200).json({
        success: true,
        message: "Lookups fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public createLookup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const result = await this.service.createLookup(companyId, req.body, currentUserId);
      res.status(201).json({
        success: true,
        message: "Lookup created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateLookup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.updateLookup(companyId, id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Lookup updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteLookup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.deleteLookup(companyId, id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Lookup deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listMasterStatuses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listMasterStatuses(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Master statuses fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listMasterStatusesByEntityType = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const entityType = req.params.entityType as string;
      const result = await this.service.listMasterStatusesByEntityType(companyId, entityType);
      res.status(200).json({
        success: true,
        message: "Master statuses fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public createMasterStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const result = await this.service.createMasterStatus(companyId, req.body, currentUserId);
      res.status(201).json({
        success: true,
        message: "Master status created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateMasterStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.updateMasterStatus(companyId, id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Master status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteMasterStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await this.service.deleteMasterStatus(companyId, id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Master status deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
