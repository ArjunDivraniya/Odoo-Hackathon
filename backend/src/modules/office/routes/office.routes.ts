import { Router } from "express";
import { OfficeController } from "../controller/office.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createOfficeSchema, updateOfficeSchema } from "../validator/office.validator";

const router = Router();
const controller = new OfficeController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("office:create") as any,
  validate(createOfficeSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("office:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("office:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("office:update") as any,
  validate(updateOfficeSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("office:delete") as any,
  controller.delete
);

export default router;
