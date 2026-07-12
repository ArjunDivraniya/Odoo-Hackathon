import { Router } from "express";
import { ResourceController } from "../controller/resource.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createResourceSchema, updateResourceSchema } from "../validator/resource.validator";

const router = Router();
const controller = new ResourceController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("resource:create") as any,
  validate(createResourceSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("resource:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("resource:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("resource:update") as any,
  validate(updateResourceSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("resource:delete") as any,
  controller.delete
);

export default router;
