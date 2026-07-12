import { Response, NextFunction } from "express";
import { EmployeeService } from "../service/employee.service";
import { AuthenticatedRequest } from "../../../types";
import { EmployeeStatus } from "@prisma/client";

export class EmployeeController {
  private service = new EmployeeService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const data = { companyId, ...req.body };
      const result = await this.service.createEmployee(data, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Employee profile created successfully",
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
      const result = await this.service.updateEmployee(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Employee profile updated successfully",
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
      await this.service.deleteEmployee(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Employee profile deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getEmployeeById(id);
      res.status(200).json({
        success: true,
        message: "Employee profile fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, status, departmentId, officeId, sortBy, sortOrder } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const companyId = req.user!.companyId;

      const result = await this.service.getEmployees({
        q: q as string,
        status: status as EmployeeStatus,
        departmentId: departmentId as string,
        officeId: officeId as string,
        companyId,
        page,
        limit,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.status(200).json({
        success: true,
        message: "Employees fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
