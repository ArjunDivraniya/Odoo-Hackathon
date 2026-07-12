import { Router } from "express";
import { ActivityLogController } from "../controller/activity-log.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createActivityLogSchema,
  listActivityLogQuerySchema,
} from "../validator/activity-log.validator";

const router = Router();
const controller = new ActivityLogController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("activity:create") as any,
  validate(createActivityLogSchema),
  controller.create
);

router.get(
  "/export",
  requirePermission("activity:read") as any,
  validate(listActivityLogQuerySchema),
  controller.export
);

router.get(
  "/user/:userId",
  requirePermission("activity:read") as any,
  controller.getUserActivity
);

router.get(
  "/entity/:entityType/:entityId",
  requirePermission("activity:read") as any,
  controller.getEntityActivity
);

router.get(
  "/audit/:entityId",
  requirePermission("activity:read") as any,
  controller.getAuditActivity
);

router.get(
  "/",
  requirePermission("activity:read") as any,
  validate(listActivityLogQuerySchema),
  controller.list
);

router.get(
  "/:id",
  requirePermission("activity:read") as any,
  controller.getById
);

export default router;
