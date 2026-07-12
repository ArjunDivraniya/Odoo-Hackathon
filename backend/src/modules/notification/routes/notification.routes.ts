import { Router } from "express";
import { NotificationController } from "../controller/notification.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createNotificationSchema,
  sendInAppSchema,
  listNotificationsQuerySchema,
  updatePreferenceSchema,
} from "../validator/notification.validator";

const router = Router();
const controller = new NotificationController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission("notification:create") as any,
  validate(createNotificationSchema),
  controller.create
);

router.get(
  "/",
  requirePermission("notification:read") as any,
  validate(listNotificationsQuerySchema),
  controller.list
);

router.get(
  "/unread-count",
  requirePermission("notification:read") as any,
  controller.unreadCount
);

router.post(
  "/read-all",
  requirePermission("notification:update") as any,
  controller.markAllRead
);

router.get(
  "/preferences",
  requirePermission("notification:read") as any,
  controller.getPreferences
);

router.patch(
  "/preferences",
  requirePermission("notification:update") as any,
  validate(updatePreferenceSchema),
  controller.updatePreferences
);

router.get(
  "/templates",
  requirePermission("notification:read") as any,
  controller.templates
);

router.post(
  "/send-inapp",
  requirePermission("notification:create") as any,
  validate(sendInAppSchema),
  controller.sendInApp
);

router.patch(
  "/:id/read",
  requirePermission("notification:update") as any,
  controller.markRead
);

router.post(
  "/:id/send-email",
  requirePermission("notification:send") as any,
  controller.sendEmail
);

router.delete(
  "/:id",
  requirePermission("notification:delete") as any,
  controller.remove
);

export default router;
