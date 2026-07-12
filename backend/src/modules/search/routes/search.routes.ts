import { Router } from "express";
import { SearchController } from "../controller/search.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { searchQuerySchema, suggestQuerySchema, logSearchSchema } from "../validator/search.validator";

const router = Router();
const controller = new SearchController();

router.use(authenticate as any);

router.get(
  "/",
  requirePermission("search:read") as any,
  validate(searchQuerySchema, "query"),
  controller.globalSearch
);

router.get(
  "/global-filters",
  requirePermission("search:read") as any,
  controller.globalFilters
);

router.get(
  "/suggest",
  requirePermission("search:read") as any,
  validate(suggestQuerySchema, "query"),
  controller.suggest
);

router.post(
  "/log",
  requirePermission("search:create") as any,
  validate(logSearchSchema, "body"),
  controller.logSearch
);

export default router;
