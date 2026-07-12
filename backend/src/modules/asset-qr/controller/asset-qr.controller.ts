import { Response, NextFunction } from "express";
import { AssetQrCodeService } from "../service/asset-qr.service";
import { AuthenticatedRequest } from "../../../types";

export class AssetQrCodeController {
  private service = new AssetQrCodeService();

  public generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.generateQrCode(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "QR code generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public scan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const { code } = req.body;
      const result = await this.service.scanQrCode(code, currentUserId);
      res.status(200).json({
        success: true,
        message: "QR code scanned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getByAsset = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assetId = req.params.assetId as string;
      const result = await this.service.getQrByAssetId(assetId);
      res.status(200).json({
        success: true,
        message: "QR code fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      await this.service.deactivateQr(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "QR code deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
