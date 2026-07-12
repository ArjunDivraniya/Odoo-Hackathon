import { Router } from "express";
import { AssetCategoryController } from "../controller/asset-category.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createAssetCategorySchema,
  updateAssetCategorySchema,
  createCustomFieldSchema,
  updateCustomFieldSchema,
} from "../validator/asset-category.validator";

const router = Router();
const controller = new AssetCategoryController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("asset_category:create") as any,
  validate(createAssetCategorySchema),
  controller.create
);
router.get(
  "/",
  requirePermission("asset_category:read") as any,
  controller.list
);
router.get(
  "/tree",
  requirePermission("asset_category:read") as any,
  controller.getTree
);
router.get(
  "/:id",
  requirePermission("asset_category:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("asset_category:update") as any,
  validate(updateAssetCategorySchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("asset_category:delete") as any,
  controller.delete
);
router.post(
  "/:id/custom-fields",
  requirePermission("asset_category:update") as any,
  validate(createCustomFieldSchema),
  controller.addCustomField
);
router.patch(
  "/custom-fields/:fieldId",
  requirePermission("asset_category:update") as any,
  validate(updateCustomFieldSchema),
  controller.updateCustomField
);
router.delete(
  "/custom-fields/:fieldId",
  requirePermission("asset_category:delete") as any,
  controller.deleteCustomField
);
router.get(
  "/:id/custom-fields",
  requirePermission("asset_category:read") as any,
  controller.getCustomFields
);

export default router;
