import { Router } from "express";
import { DashboardController } from "../controller/dashboard.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createWidgetSchema,
  updateWidgetSchema,
} from "../validator/dashboard.validator";

const router = Router();
const controller = new DashboardController();

router.use(authenticate as any);
router.use(requirePermission("dashboard:read") as any);

router.get("/summary", controller.summary);
router.get("/kpi", controller.kpi);
router.get("/assets-overview", controller.assetsOverview);
router.get("/maintenance-overview", controller.maintenanceOverview);
router.get("/audit-overview", controller.auditOverview);
router.get("/booking-overview", controller.bookingOverview);
router.get("/department-overview", controller.departmentOverview);
router.get("/recent-activities", controller.recentActivities);
router.get("/upcoming-tasks", controller.upcomingTasks);
router.get("/overdue-items", controller.overdueItems);
router.get("/charts-data", controller.chartsData);

router.get(
  "/widgets",
  requirePermission("dashboard:widget:read") as any,
  controller.listWidgets
);
router.post(
  "/widgets",
  requirePermission("dashboard:widget:create") as any,
  validate(createWidgetSchema),
  controller.createWidget
);
router.patch(
  "/widgets/:id",
  requirePermission("dashboard:widget:update") as any,
  validate(updateWidgetSchema),
  controller.updateWidget
);
router.delete(
  "/widgets/:id",
  requirePermission("dashboard:widget:delete") as any,
  controller.deleteWidget
);

export default router;
