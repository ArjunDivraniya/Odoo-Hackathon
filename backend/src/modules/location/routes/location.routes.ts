import { Router } from "express";
import { LocationController } from "../controller/location.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createLocationSchema, updateLocationSchema } from "../validator/location.validator";

const router = Router();
const controller = new LocationController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("location:create") as any,
  validate(createLocationSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("location:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("location:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("location:update") as any,
  validate(updateLocationSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("location:delete") as any,
  controller.delete
);

export default router;
