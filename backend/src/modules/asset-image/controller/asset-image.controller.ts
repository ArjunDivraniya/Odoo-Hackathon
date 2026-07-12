import { Response, NextFunction } from "express";
import { AssetImageService } from "../service/asset-image.service";
import { AuthenticatedRequest } from "../../../types";

export class AssetImageController {
  private service = new AssetImageService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createImage(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Asset image created successfully",
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
      const result = await this.service.updateImage(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset image updated successfully",
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
      await this.service.deleteImage(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset image deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getImageById(id);
      res.status(200).json({
        success: true,
        message: "Asset image fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listByAsset = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assetId = req.params.assetId as string;
      const result = await this.service.getImagesByAsset(assetId);
      res.status(200).json({
        success: true,
        message: "Asset images fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public setPrimary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.setPrimaryImage(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Primary image set successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
