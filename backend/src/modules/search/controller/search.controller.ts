import { Response, NextFunction } from "express";
import { SearchService } from "../service/search.service";
import { AuthenticatedRequest } from "../../../types";

export class SearchController {
  private service = new SearchService();

  public globalSearch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { q, types, limit } = req.query as { q?: string; types?: string; limit?: number };
      const result = await this.service.globalSearch(types, q, limit, companyId, userId);
      res.status(200).json({
        success: true,
        message: "Search completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public suggest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { q, types, limit } = req.query as { q?: string; types?: string; limit?: number };
      const result = await this.service.suggest(types, q, limit, companyId, userId);
      res.status(200).json({
        success: true,
        message: "Suggestions fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public globalFilters = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.globalFilters(companyId);
      res.status(200).json({
        success: true,
        message: "Global filters fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public logSearch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { q, types } = req.body as { q?: string; types?: string };
      const result = await this.service.logSearch(companyId, userId, { q, types });
      res.status(200).json({
        success: true,
        message: "Search event logged successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
