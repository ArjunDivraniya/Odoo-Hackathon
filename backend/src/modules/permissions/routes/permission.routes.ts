import { Router } from "express";
import { PermissionController } from "../controller/permission.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionToRoleSchema,
} from "../validator/permission.validator";

const router = Router();
const controller = new PermissionController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("permission:create") as any,
  validate(createPermissionSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("permission:read") as any,
  controller.list
);
router.patch(
  "/:id",
  requirePermission("permission:update") as any,
  validate(updatePermissionSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("permission:delete") as any,
  controller.delete
);

router.post(
  "/assign",
  requirePermission("role:update") as any,
  validate(assignPermissionToRoleSchema),
  controller.assignPermissionToRole
);

export default router;
