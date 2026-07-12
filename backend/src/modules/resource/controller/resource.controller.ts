import { Response, NextFunction } from "express";
import { ResourceService } from "../service/resource.service";
import { AuthenticatedRequest } from "../../../types";

export class ResourceController {
  private service = new ResourceService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createResource(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Resource created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getResources(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Resources fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getResourceById(id);
      res.status(200).json({
        success: true,
        message: "Resource fetched successfully",
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
      const result = await this.service.updateResource(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Resource updated successfully",
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
      await this.service.deleteResource(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Resource deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
