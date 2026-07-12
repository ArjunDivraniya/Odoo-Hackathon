import { Response, NextFunction } from "express";
import { PermissionService } from "../service/permission.service";
import { AuthenticatedRequest } from "../../../types";

export class PermissionController {
  private service = new PermissionService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createPermission(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Permission created successfully",
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
      const result = await this.service.updatePermission(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Permission updated successfully",
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
      await this.service.deletePermission(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Permission deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getPermissions();
      res.status(200).json({
        success: true,
        message: "Permissions fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public assignPermissionToRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId, permissionId } = req.body;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      await this.service.assignPermissionToRole(roleId, permissionId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Permission assigned to role successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
