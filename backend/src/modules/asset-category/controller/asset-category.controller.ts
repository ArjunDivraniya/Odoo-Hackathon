import { Response, NextFunction } from "express";
import { AssetCategoryService } from "../service/asset-category.service";
import { AuthenticatedRequest } from "../../../types";

export class AssetCategoryController {
  private service = new AssetCategoryService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createCategory(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Asset category created successfully",
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
      const result = await this.service.updateCategory(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset category updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      await this.service.deleteCategory(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getCategoryById(id);
      res.status(200).json({
        success: true,
        message: "Asset category fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getCategories(companyId);
      res.status(200).json({
        success: true,
        message: "Asset categories fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTree = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getCategoryTree(companyId);
      res.status(200).json({
        success: true,
        message: "Asset category tree fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public addCustomField = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const result = await this.service.addCustomField(id, req.body, currentUserId);
      res.status(201).json({
        success: true,
        message: "Custom field added successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateCustomField = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fieldId = req.params.fieldId as string;
      const currentUserId = req.user!.id;
      const result = await this.service.updateCustomField(fieldId, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Custom field updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteCustomField = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fieldId = req.params.fieldId as string;
      const currentUserId = req.user!.id;
      await this.service.deleteCustomField(fieldId, currentUserId);
      res.status(200).json({
        success: true,
        message: "Custom field deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getCustomFields = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getCategoryById(id);
      res.status(200).json({
        success: true,
        message: "Custom fields fetched successfully",
        data: (result as any).customFields,
      });
    } catch (error) {
      next(error);
    }
  };
}
