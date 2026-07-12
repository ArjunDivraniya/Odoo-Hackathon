import { Router } from "express";
import { DepartmentController } from "../controller/department.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createDepartmentSchema, updateDepartmentSchema } from "../validator/department.validator";

const router = Router();
const controller = new DepartmentController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("department:create") as any,
  validate(createDepartmentSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("department:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("department:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("department:update") as any,
  validate(updateDepartmentSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("department:delete") as any,
  controller.delete
);

router.get(
  "/:id/hierarchy",
  requirePermission("department:read") as any,
  controller.getHierarchy
);

export default router;
