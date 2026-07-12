import { Router } from "express";
import { CompanyController } from "../controller/company.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { createCompanySchema, updateCompanySchema } from "../validator/company.validator";

const router = Router();
const controller = new CompanyController();

// All routes require authentication
router.use(authenticate as any);

router.post(
  "/",
  requirePermission("company:create") as any,
  validate(createCompanySchema),
  controller.create
);
router.get(
  "/",
  requirePermission("company:read") as any,
  controller.list
);
router.get(
  "/:id",
  requirePermission("company:read") as any,
  controller.getById
);
router.patch(
  "/:id",
  requirePermission("company:update") as any,
  validate(updateCompanySchema),
  controller.update
);
router.delete(
  "/:id",
  requirePermission("company:delete") as any,
  controller.delete
);

export default router;
