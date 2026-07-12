import { Response, NextFunction } from "express";
import { UserService } from "../service/user.service";
import { AuthenticatedRequest } from "../../../types";
import { UserStatus } from "@prisma/client";

export class UserController {
  private service = new UserService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createUser(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "User created successfully",
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
      const result = await this.service.updateUser(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "User updated successfully",
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
      await this.service.deleteUser(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getUserById(id);
      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, status, role, sortBy, sortOrder } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await this.service.getUsers({
        q: q as string,
        status: status as UserStatus,
        role: role as string,
        companyId: req.user!.companyId,
        page,
        limit,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public bulkActivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds } = req.body;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      await this.service.bulkActivate(userIds, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Users activated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public bulkDeactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds } = req.body;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      await this.service.bulkDeactivate(userIds, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Users deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // === ROLE MAPPING CONTROLLERS ===

  public assignRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string; // User ID
      const { roleId, companyId } = req.body;
      const scopeCompanyId = companyId || req.user!.companyId;
      const currentUserId = req.user!.id;

      await this.service.assignRole(id, roleId, scopeCompanyId, currentUserId);
      res.status(200).json({
        success: true,
        message: "Role assigned successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public removeRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const roleId = req.params.roleId as string;
      const companyId = req.user!.companyId;
      const currentUserId = req.user!.id;

      await this.service.removeRole(id, roleId, companyId, currentUserId);
      res.status(200).json({
        success: true,
        message: "Role removed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserRoles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getUserRoles(id);
      res.status(200).json({
        success: true,
        message: "User roles fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
