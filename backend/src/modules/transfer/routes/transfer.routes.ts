import { Router } from "express";
import { TransferController } from "../controller/transfer.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createTransferSchema, updateTransferSchema, approveTransferSchema, receiveTransferSchema } from "../validator/transfer.validator";

const router = Router();
const controller = new TransferController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("transfer:create") as any,
  validate(createTransferSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("transfer:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("transfer:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("transfer:update") as any,
  validate(updateTransferSchema),
  controller.update
);
router.patch(
  "/:id/approve",
  requirePermission("transfer:update") as any,
  validate(approveTransferSchema),
  controller.approve
);
router.patch(
  "/:id/receive",
  requirePermission("transfer:update") as any,
  validate(receiveTransferSchema),
  controller.receive
);
router.patch(
  "/:id/cancel",
  requirePermission("transfer:update") as any,
  controller.cancel
);

export default router;
