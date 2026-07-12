import { Response, NextFunction } from "express";
import { OfficeService } from "../service/office.service";
import { AuthenticatedRequest } from "../../../types";

export class OfficeController {
  private service = new OfficeService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      // Default companyId if not provided
      const data = { companyId, ...req.body };
      const result = await this.service.createOffice(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Office created successfully",
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
      const result = await this.service.updateOffice(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Office updated successfully",
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
      await this.service.deleteOffice(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Office deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getOfficeById(id);
      res.status(200).json({
        success: true,
        message: "Office fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getOffices(companyId);
      res.status(200).json({
        success: true,
        message: "Offices fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
