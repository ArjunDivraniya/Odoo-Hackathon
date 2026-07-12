import { Response, NextFunction } from "express";
import { FloorService } from "../service/floor.service";
import { AuthenticatedRequest } from "../../../types";

export class FloorController {
  private service = new FloorService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createFloor(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Floor created successfully",
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
      const result = await this.service.updateFloor(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Floor updated successfully",
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
      await this.service.deleteFloor(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Floor deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getFloorById(id);
      res.status(200).json({
        success: true,
        message: "Floor fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getFloors(companyId);
      res.status(200).json({
        success: true,
        message: "Floors fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
