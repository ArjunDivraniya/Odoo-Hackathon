import { Response, NextFunction } from "express";
import { AssetReturnService } from "../service/asset-return.service";
import { AuthenticatedRequest } from "../../../types";

export class AssetReturnController {
  private service = new AssetReturnService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createReturn(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Asset return created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public verify = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const { verified, notes } = req.body;
      const result = await this.service.verifyReturn(id, verified, notes, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: verified ? "Return verified successfully" : "Return rejected successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getReturnById(id);
      res.status(200).json({
        success: true,
        message: "Return fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getReturns(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Returns fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
