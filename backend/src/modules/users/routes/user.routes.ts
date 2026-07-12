import { Router } from "express";
import { UserController } from "../controller/user.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
  bulkStatusSchema,
} from "../validator/user.validator";

const router = Router();
const controller = new UserController();

// All routes here require authentication
router.use(authenticate as any);

// User CRUD
router.post(
  "/",
  requirePermission("user:create") as any,
  validate(createUserSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("user:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("user:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("user:update") as any,
  validate(updateUserSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("user:delete") as any,
  controller.delete
);

// Bulk Operations
router.post(
  "/bulk-activate",
  requirePermission("user:update") as any,
  validate(bulkStatusSchema),
  controller.bulkActivate
);
router.post(
  "/bulk-deactivate",
  requirePermission("user:update") as any,
  validate(bulkStatusSchema),
  controller.bulkDeactivate
);

// User-Role Mapping Assignments
router.post(
  "/:id/roles",
  requirePermission("role:assign") as any,
  validate(assignRoleSchema),
  controller.assignRole
);
router.delete(
  "/:id/roles/:roleId",
  requirePermission("role:assign") as any,
  controller.removeRole
);
router.get(
  "/:id/roles",
  requirePermission("user:read") as any,
  controller.getUserRoles
);

export default router;
