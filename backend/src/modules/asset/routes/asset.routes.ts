import { Router } from "express";
import { AssetController } from "../controller/asset.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createAssetSchema, updateAssetSchema } from "../validator/asset.validator";
import { z } from "zod";

const router = Router();
const controller = new AssetController();

const updateStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("asset:create") as any,
  validate(createAssetSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("asset:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("asset:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("asset:update") as any,
  validate(updateAssetSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("asset:delete") as any,
  controller.delete
);
router.patch(
  "/:id/status",
  requirePermission("asset:update") as any,
  validate(updateStatusSchema),
  controller.updateStatus
);

export default router;
