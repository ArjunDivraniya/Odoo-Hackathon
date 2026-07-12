import { Response, NextFunction } from "express";
import { DashboardService } from "../service/dashboard.service";
import { AuthenticatedRequest } from "../../../types";

export class DashboardController {
  private service = new DashboardService();

  public summary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getSummary(companyId);
      res.status(200).json({ success: true, message: "Dashboard summary fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public kpi = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getKpi(companyId);
      res.status(200).json({ success: true, message: "KPI cards fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public assetsOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getAssetsOverview(companyId);
      res.status(200).json({ success: true, message: "Assets overview fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public maintenanceOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getMaintenanceOverview(companyId);
      res.status(200).json({ success: true, message: "Maintenance overview fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public auditOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getAuditOverview(companyId);
      res.status(200).json({ success: true, message: "Audit overview fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public bookingOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getBookingOverview(companyId);
      res.status(200).json({ success: true, message: "Booking overview fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public departmentOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getDepartmentOverview(companyId);
      res.status(200).json({ success: true, message: "Department overview fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public recentActivities = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const limit = Number(req.query.limit) || 10;
      const data = await this.service.getRecentActivities(companyId, limit);
      res.status(200).json({ success: true, message: "Recent activities fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public upcomingTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getUpcomingTasks(companyId);
      res.status(200).json({ success: true, message: "Upcoming tasks fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public overdueItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getOverdueItems(companyId);
      res.status(200).json({ success: true, message: "Overdue items fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public chartsData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data = await this.service.getChartsData(companyId);
      res.status(200).json({ success: true, message: "Charts data fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public listWidgets = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = await this.service.getWidgets(userId);
      res.status(200).json({ success: true, message: "Widgets fetched", data });
    } catch (error) {
      next(error);
    }
  };

  public createWidget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = await this.service.createWidget({
        ...req.body,
        userId,
      });
      res.status(201).json({ success: true, message: "Widget created successfully", data });
    } catch (error) {
      next(error);
    }
  };

  public updateWidget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const result = await this.service.updateWidget(id, userId, req.body);
      if (result === null) {
        const { NotFoundError } = await import("../../../errors/app-error");
        return next(new NotFoundError("Widget not found"));
      }
      if (result === "FORBIDDEN") {
        const { ForbiddenError } = await import("../../../errors/app-error");
        return next(new ForbiddenError("You are not allowed to update this widget"));
      }
      res.status(200).json({ success: true, message: "Widget updated successfully", data: result });
    } catch (error) {
      next(error);
    }
  };

  public deleteWidget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const result = await this.service.deleteWidget(id, userId);
      if (result === null) {
        const { NotFoundError } = await import("../../../errors/app-error");
        return next(new NotFoundError("Widget not found"));
      }
      if (result === "FORBIDDEN") {
        const { ForbiddenError } = await import("../../../errors/app-error");
        return next(new ForbiddenError("You are not allowed to delete this widget"));
      }
      res.status(200).json({ success: true, message: "Widget deleted successfully", data: { id } });
    } catch (error) {
      next(error);
    }
  };
}
