import { Response, NextFunction } from "express";
import { AllocationService } from "../service/allocation.service";
import { AuthenticatedRequest } from "../../../types";

export class AllocationController {
  private service = new AllocationService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createAllocation(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Allocation created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const { approved, rejectionReason } = req.body;
      const result = await this.service.approveAllocation(id, approved, rejectionReason, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: approved ? "Allocation approved successfully" : "Allocation rejected successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.activateAllocation(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Allocation activated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.cancelAllocation(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Allocation cancelled successfully",
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
      const result = await this.service.updateAllocation(id, req.body, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Allocation updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getAllocationById(id);
      res.status(200).json({
        success: true,
        message: "Allocation fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getAllocations(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Allocations fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listByEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.params.employeeId as string;
      const result = await this.service.getAllocationsByEmployee(employeeId);
      res.status(200).json({
        success: true,
        message: "Employee allocations fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
