import { Router } from "express";
import { AssetDocumentController } from "../controller/asset-document.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createAssetDocumentSchema, updateAssetDocumentSchema } from "../validator/asset-document.validator";

const router = Router();
const controller = new AssetDocumentController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("asset_document:create") as any,
  validate(createAssetDocumentSchema),
  controller.create
);
router.get(
  "/asset/:assetId",
  requirePermission("asset_document:read") as any,
  controller.listByAsset
);
router.get(
  "/:id",
  requirePermission("asset_document:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("asset_document:update") as any,
  validate(updateAssetDocumentSchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("asset_document:delete") as any,
  controller.delete
);

export default router;
