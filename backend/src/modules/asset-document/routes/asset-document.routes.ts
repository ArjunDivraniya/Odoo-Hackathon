import { Router } from "express";
import { AssetDocumentController } from "../controller/asset-document.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { uploadDocument } from "../../../middleware/upload.middleware";

const router = Router();
const controller = new AssetDocumentController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("asset_document:create") as any,
  uploadDocument.single("document"),
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
  uploadDocument.single("document"),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("asset_document:delete") as any,
  controller.delete
);

export default router;
