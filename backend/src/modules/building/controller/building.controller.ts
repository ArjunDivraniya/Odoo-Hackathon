import { Response, NextFunction } from "express";
import { BuildingService } from "../service/building.service";
import { AuthenticatedRequest } from "../../../types";

export class BuildingController {
  private service = new BuildingService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createBuilding(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Building created successfully",
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
      const result = await this.service.updateBuilding(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Building updated successfully",
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
      await this.service.deleteBuilding(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Building deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getBuildingById(id);
      res.status(200).json({
        success: true,
        message: "Building fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getBuildings(companyId);
      res.status(200).json({
        success: true,
        message: "Buildings fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
