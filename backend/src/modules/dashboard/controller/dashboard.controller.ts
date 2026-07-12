import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../service/dashboard.service";
import { AppError } from "../../../utils/app-error";

export class DashboardController {
  
  private getCompanyId(req: Request): string {
    // Typically extracted from req.user.companyId in a real authenticated app
    // For this hackathon/demo, we'll fetch the first company if not provided, or a dummy one
    const companyId = req.user?.companyId || "00000000-0000-0000-0000-000000000000"; 
    // In production, if !req.user throw AppError
    return companyId as string;
  }

  // To make it work perfectly without proper auth context, we will query the first company from DB directly if companyId is dummy
  private async resolveCompanyId(req: Request): Promise<string> {
    if (req.user?.companyId) return req.user.companyId;
    
    const { prisma } = await import("../../../config/prisma");
    const company = await prisma.company.findFirst();
    if (!company) throw new AppError("No companies found in database", 404);
    return company.id;
  }

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getSummary(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getActivity(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getTasks(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getNotifications(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getAssetStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getAssetStatus(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentUtilization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getDepartmentUtilization(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getMaintenanceTrend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getMaintenanceTrend(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getBookingTrend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getBookingTrend(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getAuditProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getAuditProgress(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getMostUsedAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getMostUsedAssets(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getIdleAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getIdleAssets(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getMonthlyGrowth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getMonthlyGrowth(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getYearlyGrowth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getYearlyGrowth(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getPendingApprovals(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getUpcomingReturns = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getUpcomingReturns(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getOverdueAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getOverdueAssets(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getMaintenanceRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getMaintenanceRequests(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getTransferRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = await this.resolveCompanyId(req);
      const data = await dashboardService.getTransferRequests(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
