import { Router } from "express";
import { EmployeeController } from "../controller/employee.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createEmployeeSchema, updateEmployeeSchema } from "../validator/employee.validator";

const router = Router();
const controller = new EmployeeController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("employee:create") as any,
  validate(createEmployeeSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("employee:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("employee:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("employee:update") as any,
  validate(updateEmployeeSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("employee:delete") as any,
  controller.delete
);

export default router;
