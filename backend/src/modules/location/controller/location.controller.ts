import { Response, NextFunction } from "express";
import { LocationService } from "../service/location.service";
import { AuthenticatedRequest } from "../../../types";

export class LocationController {
  private service = new LocationService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createLocation(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Location created successfully",
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
      const result = await this.service.updateLocation(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Location updated successfully",
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
      await this.service.deleteLocation(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Location deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getLocationById(id);
      res.status(200).json({
        success: true,
        message: "Location fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getLocations(companyId);
      res.status(200).json({
        success: true,
        message: "Locations fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
