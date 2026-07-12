import { Router } from "express";
import { FloorController } from "../controller/floor.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createFloorSchema, updateFloorSchema } from "../validator/floor.validator";

const router = Router();
const controller = new FloorController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("floor:create") as any,
  validate(createFloorSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("floor:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("floor:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("floor:update") as any,
  validate(updateFloorSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("floor:delete") as any,
  controller.delete
);

export default router;
