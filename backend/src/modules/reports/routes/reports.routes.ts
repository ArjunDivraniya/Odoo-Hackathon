import { Router } from "express";
import { ReportsController } from "../controller/reports.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  reportQuerySchema,
  metadataBodySchema,
  metadataUpdateSchema,
  metadataQuerySchema,
  generateQuerySchema,
  genericExportQuerySchema,
} from "../validator/reports.validator";

const router = Router();
const controller = new ReportsController();

router.use(authenticate as any);

// 1-8. Aggregated report endpoints
router.get(
  "/assets",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.assets
);
router.get(
  "/maintenance",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.maintenance
);
router.get(
  "/audits",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.audits
);
router.get(
  "/departments",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.departments
);
router.get(
  "/employees",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.employees
);
router.get(
  "/allocations",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.allocations
);
router.get(
  "/utilization",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.utilization
);
router.get(
  "/bookings",
  requirePermission("report:read") as any,
  validate(reportQuerySchema, "query") as any,
  controller.bookings
);

// 9. Save report definition
router.post(
  "/metadata",
  requirePermission("report:create") as any,
  validate(metadataBodySchema) as any,
  controller.createMetadata
);

// 10. List report definitions
router.get(
  "/metadata",
  requirePermission("report:read") as any,
  validate(metadataQuerySchema, "query") as any,
  controller.listMetadata
);

// 15. Generic export API
router.get(
  "/export",
  requirePermission("report:export") as any,
  validate(genericExportQuerySchema, "query") as any,
  controller.exportGeneric
);

// 11. Get definition
router.get(
  "/metadata/:id",
  requirePermission("report:read") as any,
  controller.getMetadata
);

// 12. Update definition
router.patch(
  "/metadata/:id",
  requirePermission("report:update") as any,
  validate(metadataUpdateSchema) as any,
  controller.updateMetadata
);

// 13. Soft delete definition
router.delete(
  "/metadata/:id",
  requirePermission("report:delete") as any,
  controller.deleteMetadata
);

// 14. Generate report from saved definition
router.post(
  "/generate/:id",
  requirePermission("report:read") as any,
  validate(generateQuerySchema, "query") as any,
  controller.generate
);

export default router;
