import { Router } from "express";
import multer from "multer";
import { FileStorageController } from "../controller/file-storage.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  listFilesQuerySchema,
  signedUrlQuerySchema,
} from "../validator/file-storage.validator";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();
const controller = new FileStorageController();

router.use(authenticate as any);

router.post(
  "/upload",
  requirePermission("file:upload") as any,
  upload.single("file"),
  controller.upload
);

router.post(
  "/upload/multiple",
  requirePermission("file:upload") as any,
  upload.array("files", 10),
  controller.uploadMultiple
);

router.get(
  "/",
  requirePermission("file:read") as any,
  validate(listFilesQuerySchema, "query"),
  controller.list
);

router.get(
  "/:id",
  requirePermission("file:read") as any,
  controller.getById
);

router.get(
  "/:id/download",
  requirePermission("file:read") as any,
  controller.download
);

router.get(
  "/:id/signed-url",
  requirePermission("file:read") as any,
  validate(signedUrlQuerySchema, "query"),
  controller.signedUrl
);

router.delete(
  "/:id",
  requirePermission("file:delete") as any,
  controller.remove
);

export default router;
