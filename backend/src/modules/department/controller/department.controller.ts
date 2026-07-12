import { Response, NextFunction } from "express";
import { DepartmentService } from "../service/department.service";
import { AuthenticatedRequest } from "../../../types";

export class DepartmentController {
  private service = new DepartmentService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createDepartment(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Department created successfully",
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
      const result = await this.service.updateDepartment(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Department updated successfully",
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
      await this.service.deleteDepartment(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getDepartmentById(id);
      res.status(200).json({
        success: true,
        message: "Department fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getDepartments(companyId);
      res.status(200).json({
        success: true,
        message: "Departments fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getHierarchy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getDepartmentHierarchy(id);
      res.status(200).json({
        success: true,
        message: "Department hierarchy fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
