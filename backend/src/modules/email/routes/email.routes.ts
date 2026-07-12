import { Router } from "express";
import { EmailController } from "../controller/email.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createTemplateSchema,
  updateTemplateSchema,
  previewTemplateSchema,
  sendEmailSchema,
} from "../validator/email.validator";

const router = Router();
const controller = new EmailController();

router.use(authenticate as any);

router.get(
  "/",
  requirePermission("email:read") as any,
  controller.list
);
router.post(
  "/send",
  requirePermission("email:send") as any,
  validate(sendEmailSchema),
  controller.send
);
router.post(
  "/",
  requirePermission("email:create") as any,
  validate(createTemplateSchema),
  controller.create
);
router.get(
  "/:id",
  requirePermission("email:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("email:update") as any,
  validate(updateTemplateSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("email:update") as any,
  controller.remove
);
router.post(
  "/:id/preview",
  requirePermission("email:read") as any,
  validate(previewTemplateSchema),
  controller.preview
);

export default router;
