import { Response, NextFunction } from "express";
import { AssetService } from "../service/asset.service";
import { AuthenticatedRequest } from "../../../types";

export class AssetController {
  private service = new AssetService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createAsset(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Asset created successfully",
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
      const result = await this.service.updateAsset(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset updated successfully",
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
      await this.service.deleteAsset(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getAssetById(id);
      res.status(200).json({
        success: true,
        message: "Asset fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getAssets(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Assets fetched successfully",
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
      const { status, reason, notes } = req.body;
      const result = await this.service.updateAssetStatus(id, status, reason, notes, currentUserId);
      res.status(200).json({
        success: true,
        message: "Asset status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
