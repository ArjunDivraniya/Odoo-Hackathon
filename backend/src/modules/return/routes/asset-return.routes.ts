import { Router } from "express";
import { AssetReturnController } from "../controller/asset-return.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createReturnSchema, verifyReturnSchema } from "../validator/asset-return.validator";

const router = Router();
const controller = new AssetReturnController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("return:create") as any,
  validate(createReturnSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("return:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("return:read") as any,
  controller.getById
);
router.patch(
  "/:id/verify",
  requirePermission("return:update") as any,
  validate(verifyReturnSchema),
  controller.verify
);

export default router;
