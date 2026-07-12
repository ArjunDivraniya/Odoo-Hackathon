import { Router } from "express";
import { AllocationController } from "../controller/allocation.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createAllocationSchema,
  approveAllocationSchema,
  updateAllocationSchema,
} from "../validator/allocation.validator";

const router = Router();
const controller = new AllocationController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("allocation:create") as any,
  validate(createAllocationSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("allocation:read") as any,
  controller.list
);
router.get(
  "/employee/:employeeId",
  requirePermission("allocation:read") as any,
  controller.listByEmployee
);
router.get(
  "/:id",
  requirePermission("allocation:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("allocation:update") as any,
  validate(updateAllocationSchema),
  controller.update
);
router.patch(
  "/:id/approve",
  requirePermission("allocation:update") as any,
  validate(approveAllocationSchema),
  controller.approve
);
router.patch(
  "/:id/activate",
  requirePermission("allocation:update") as any,
  controller.activate
);
router.patch(
  "/:id/cancel",
  requirePermission("allocation:update") as any,
  controller.cancel
);

export default router;
