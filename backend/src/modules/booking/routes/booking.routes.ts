import { Router } from "express";
import { BookingController } from "../controller/booking.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createBookingSchema, updateBookingSchema, cancelBookingSchema } from "../validator/booking.validator";

const router = Router();
const controller = new BookingController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("booking:create") as any,
  validate(createBookingSchema),
  controller.create
);
router.get(
  "/",
  requirePermission("booking:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("booking:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("booking:update") as any,
  validate(updateBookingSchema),
  controller.update
);
router.patch(
  "/:id/confirm",
  requirePermission("booking:update") as any,
  controller.confirm
);
router.patch(
  "/:id/cancel",
  requirePermission("booking:update") as any,
  validate(cancelBookingSchema),
  controller.cancel
);
router.patch(
  "/:id/complete",
  requirePermission("booking:update") as any,
  controller.complete
);
router.patch(
  "/:id/check-in",
  requirePermission("booking:update") as any,
  controller.checkIn
);

export default router;
