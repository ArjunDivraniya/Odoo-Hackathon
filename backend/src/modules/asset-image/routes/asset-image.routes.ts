import { Router } from "express";
import { AssetImageController } from "../controller/asset-image.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createAssetImageSchema, updateAssetImageSchema } from "../validator/asset-image.validator";

const router = Router();
const controller = new AssetImageController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("asset_image:create") as any,
  validate(createAssetImageSchema),
  controller.create
);
router.get(
  "/asset/:assetId",
  requirePermission("asset_image:read") as any,
  controller.listByAsset
);
router.get(
  "/:id",
  requirePermission("asset_image:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("asset_image:update") as any,
  validate(updateAssetImageSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("asset_image:delete") as any,
  controller.delete
);
router.patch(
  "/:id/primary",
  requirePermission("asset_image:update") as any,
  controller.setPrimary
);

export default router;
