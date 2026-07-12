import { Router } from "express";
import { AssetQrCodeController } from "../controller/asset-qr.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { generateQrSchema, scanQrSchema } from "../validator/asset-qr.validator";

const router = Router();
const controller = new AssetQrCodeController();

router.use(authenticate as any);

router.post(
  "/generate",
  requirePermission("asset_qr:create") as any,
  validate(generateQrSchema),
  controller.generate
);
router.post(
  "/scan",
  requirePermission("asset_qr:read") as any,
  validate(scanQrSchema),
  controller.scan
);
router.get(
  "/asset/:assetId",
  requirePermission("asset_qr:read") as any,
  controller.getByAsset
);
router.patch(
  "/:id/deactivate",
  requirePermission("asset_qr:update") as any,
  controller.deactivate
);

export default router;
