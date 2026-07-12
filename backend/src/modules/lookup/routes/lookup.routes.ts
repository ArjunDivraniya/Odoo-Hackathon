import { Router } from "express";
import { LookupController } from "../controller/lookup.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createLookupSchema,
  updateLookupSchema,
  createMasterStatusSchema,
  updateMasterStatusSchema,
} from "../validator/lookup.validator";

const router = Router();
const controller = new LookupController();

router.use(authenticate as any);

// Master status routes (declared before generic lookup param routes)
router.get(
  "/master-status",
  requirePermission("lookup:read") as any,
  controller.listMasterStatuses
);
router.get(
  "/master-status/:entityType",
  requirePermission("lookup:read") as any,
  controller.listMasterStatusesByEntityType
);
router.post(
  "/master-status",
  requirePermission("lookup:create") as any,
  validate(createMasterStatusSchema),
  controller.createMasterStatus
);
router.patch(
  "/master-status/:id",
  requirePermission("lookup:update") as any,
  validate(updateMasterStatusSchema),
  controller.updateMasterStatus
);
router.delete(
  "/master-status/:id",
  requirePermission("lookup:update") as any,
  controller.deleteMasterStatus
);

// Lookup routes
router.get(
  "/",
  requirePermission("lookup:read") as any,
  controller.listLookups
);
router.get(
  "/category/:category",
  requirePermission("lookup:read") as any,
  controller.listByCategory
);
router.post(
  "/",
  requirePermission("lookup:create") as any,
  validate(createLookupSchema),
  controller.createLookup
);
router.patch(
  "/:id",
  requirePermission("lookup:update") as any,
  validate(updateLookupSchema),
  controller.updateLookup
);
router.delete(
  "/:id",
  requirePermission("lookup:update") as any,
  controller.deleteLookup
);

export default router;
