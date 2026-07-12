import { Router } from "express";
import { SystemController } from "../controller/system.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  upsertSettingSchema,
  applicationConfigSchema,
  workingHoursSchema,
  createHolidaySchema,
  updateHolidaySchema,
} from "../validator/system.validator";

const router = Router();
const controller = new SystemController();

router.use(authenticate as any);

router.get(
  "/settings",
  requirePermission("system:read") as any,
  controller.listSettings
);
router.get(
  "/settings/:key",
  requirePermission("system:read") as any,
  controller.getSetting
);
router.put(
  "/settings/:key",
  requirePermission("system:update") as any,
  validate(upsertSettingSchema),
  controller.upsertSetting
);
router.delete(
  "/settings/:key",
  requirePermission("system:update") as any,
  controller.deleteSetting
);

router.get(
  "/application-config",
  requirePermission("system:read") as any,
  controller.getApplicationConfig
);
router.put(
  "/application-config",
  requirePermission("system:update") as any,
  validate(applicationConfigSchema),
  controller.updateApplicationConfig
);

router.get(
  "/working-hours/:officeId",
  requirePermission("system:read") as any,
  controller.getWorkingHours
);
router.put(
  "/working-hours/:officeId",
  requirePermission("system:update") as any,
  validate(workingHoursSchema),
  controller.updateWorkingHours
);

router.get(
  "/holidays",
  requirePermission("system:read") as any,
  controller.listHolidays
);
router.post(
  "/holidays",
  requirePermission("system:create") as any,
  validate(createHolidaySchema),
  controller.createHoliday
);
router.patch(
  "/holidays/:id",
  requirePermission("system:update") as any,
  validate(updateHolidaySchema),
  controller.updateHoliday
);
router.delete(
  "/holidays/:id",
  requirePermission("system:update") as any,
  controller.deleteHoliday
);

export default router;
