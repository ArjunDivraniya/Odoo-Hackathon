import { Router } from "express";
import { MaintenanceController } from "../controller/maintenance.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  rejectMaintenanceSchema,
  assignTechnicianSchema,
  updateStatusSchema,
  addAttachmentSchema,
  maintenanceListQuerySchema,
  maintenanceSearchQuerySchema,
} from "../validator/maintenance.validator";

const router = Router();
const controller = new MaintenanceController();

router.use(authenticate as any);

// 16. Filter options (declared before /:id to avoid collisions)
router.get(
  "/filters/options",
  requirePermission("maintenance:read") as any,
  controller.getFilterOptions
);

// 15. Search
router.get(
  "/search",
  requirePermission("maintenance:read") as any,
  validate(maintenanceSearchQuerySchema, "query"),
  controller.search
);

// 1. Create maintenance request
router.post(
  "/",
  requirePermission("maintenance:create") as any,
  validate(createMaintenanceSchema),
  controller.create
);

// 2. List maintenance requests
router.get(
  "/",
  requirePermission("maintenance:read") as any,
  validate(maintenanceListQuerySchema, "query"),
  controller.list
);

// 3. Get by id
router.get(
  "/:id",
  requirePermission("maintenance:read") as any,
  controller.getById
);

// 4. Update maintenance request
router.patch(
  "/:id",
  requirePermission("maintenance:update") as any,
  validate(updateMaintenanceSchema),
  controller.update
);

// 5. Approve
router.post(
  "/:id/approve",
  requirePermission("maintenance:approve") as any,
  controller.approve
);

// 6. Reject
router.post(
  "/:id/reject",
  requirePermission("maintenance:approve") as any,
  validate(rejectMaintenanceSchema),
  controller.reject
);

// 7. Assign technician
router.post(
  "/:id/assign-technician",
  requirePermission("maintenance:assign") as any,
  validate(assignTechnicianSchema),
  controller.assignTechnician
);

// 8. Update status
router.patch(
  "/:id/status",
  requirePermission("maintenance:update") as any,
  validate(updateStatusSchema),
  controller.updateStatus
);

// 9. Complete
router.post(
  "/:id/complete",
  requirePermission("maintenance:complete") as any,
  controller.complete
);

// 10. Timeline
router.get(
  "/:id/timeline",
  requirePermission("maintenance:read") as any,
  controller.getTimeline
);

// 11. Add attachment
router.post(
  "/:id/attachments",
  requirePermission("maintenance:update") as any,
  validate(addAttachmentSchema),
  controller.addAttachment
);

// 12. List attachments
router.get(
  "/:id/attachments",
  requirePermission("maintenance:read") as any,
  controller.listAttachments
);

// 13. Soft delete attachment
router.delete(
  "/:id/attachments/:attachmentId",
  requirePermission("maintenance:update") as any,
  controller.deleteAttachment
);

// 14. History
router.get(
  "/:id/history",
  requirePermission("maintenance:read") as any,
  controller.getHistory
);

export default router;
