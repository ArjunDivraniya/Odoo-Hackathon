import { Router } from "express";
import { AnalyticsController } from "../controller/analytics.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  analyticsQuerySchema,
  customAnalyticsSchema,
} from "../validator/analytics.validator";

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate as any);

router.get(
  "/asset-utilization",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.assetUtilization
);
router.get(
  "/most-used-assets",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.mostUsedAssets
);
router.get(
  "/idle-assets",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.idleAssets
);
router.get(
  "/maintenance-trends",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.maintenanceTrends
);
router.get(
  "/department",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.department
);
router.get(
  "/monthly",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.monthly
);
router.get(
  "/yearly",
  requirePermission("analytics:read") as any,
  validate(analyticsQuerySchema, "query") as any,
  controller.yearly
);
router.get(
  "/custom",
  requirePermission("analytics:read") as any,
  validate(customAnalyticsSchema, "query") as any,
  controller.custom
);

export default router;
