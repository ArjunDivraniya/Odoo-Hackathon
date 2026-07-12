import { Response, NextFunction } from "express";
import { RoleService } from "../service/role.service";
import { AuthenticatedRequest } from "../../../types";

export class RoleController {
  private service = new RoleService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { ...req.body, companyId };
      const result = await this.service.createRole(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Role created successfully",
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
      const result = await this.service.updateRole(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Role updated successfully",
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
      await this.service.deleteRole(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getRoleById(id);
      res.status(200).json({
        success: true,
        message: "Role details fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getRoles(companyId);
      res.status(200).json({
        success: true,
        message: "Roles fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public assignPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string; // Role ID
      const { permissionId } = req.body;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;

      await this.service.assignPermission(id, permissionId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Permission assigned successfully to role",
      });
    } catch (error) {
      next(error);
    }
  };

  public removePermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const permissionId = req.params.permissionId as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;

      await this.service.removePermission(id, permissionId, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Permission removed successfully from role",
      });
    } catch (error) {
      next(error);
    }
  };
}
