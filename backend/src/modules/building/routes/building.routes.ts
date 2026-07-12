import { Router } from "express";
import { BuildingController } from "../controller/building.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createBuildingSchema, updateBuildingSchema } from "../validator/building.validator";

const router = Router();
const controller = new BuildingController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("building:create") as any,
  validate(createBuildingSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("building:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("building:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("building:update") as any,
  validate(updateBuildingSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("building:delete") as any,
  controller.delete
);

export default router;
