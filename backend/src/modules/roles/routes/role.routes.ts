import { Router } from "express";
import { RoleController } from "../controller/role.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
} from "../validator/role.validator";

const router = Router();
const controller = new RoleController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("role:create") as any,
  validate(createRoleSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("role:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("role:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("role:update") as any,
  validate(updateRoleSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("role:delete") as any,
  controller.delete
);

// Role-Permission Assignments
router.post(
  "/:id/permissions",
  requirePermission("role:update") as any,
  validate(assignPermissionSchema),
  controller.assignPermission
);
router.delete(
  "/:id/permissions/:permissionId",
  requirePermission("role:update") as any,
  controller.removePermission
);

export default router;
