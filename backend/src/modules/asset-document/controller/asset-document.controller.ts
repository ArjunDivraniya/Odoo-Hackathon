import { Response, NextFunction } from "express";
import { AssetDocumentService } from "../service/asset-document.service";
import { AuthenticatedRequest } from "../../../types";

export class AssetDocumentController {
  private service = new AssetDocumentService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createDocument(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Asset document created successfully",
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
      const result = await this.service.updateDocument(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset document updated successfully",
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
      await this.service.deleteDocument(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Asset document deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getDocumentById(id);
      res.status(200).json({
        success: true,
        message: "Asset document fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listByAsset = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assetId = req.params.assetId as string;
      const result = await this.service.getDocumentsByAsset(assetId);
      res.status(200).json({
        success: true,
        message: "Asset documents fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
