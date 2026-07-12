import { Response, NextFunction } from "express";
import { CompanyService } from "../service/company.service";
import { AuthenticatedRequest } from "../../../types";

export class CompanyController {
  private service = new CompanyService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const result = await this.service.createCompany(req.body, currentUserId);
      res.status(201).json({
        success: true,
        message: "Company created successfully",
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
      const result = await this.service.updateCompany(id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Company updated successfully",
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
      await this.service.deleteCompany(id, currentUserId);
      res.status(200).json({
        success: true,
        message: "Company deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getCompanyById(id);
      res.status(200).json({
        success: true,
        message: "Company fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getCompanies();
      res.status(200).json({
        success: true,
        message: "Companies fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
