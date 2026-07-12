import { Response, NextFunction } from "express";
import { TransferService } from "../service/transfer.service";
import { AuthenticatedRequest } from "../../../types";

export class TransferController {
  private service = new TransferService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createTransfer(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Transfer request created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getTransfers(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Transfers fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getTransferById(id);
      res.status(200).json({
        success: true,
        message: "Transfer fetched successfully",
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
      const { TransferRepository } = await import("../repository/transfer.repository");
      const repository = new TransferRepository();
      const existing = await repository.findById(id);
      if (!existing) {
        return next(new (await import("../../../errors/app-error")).NotFoundError("Transfer not found"));
      }
      const updated = await repository.update(id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Transfer updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.approveTransfer(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Transfer approved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public receive = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.receiveTransfer(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Transfer received successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.cancelTransfer(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Transfer cancelled successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
