import { Router } from "express";
import { AuditController } from "../controller/audit.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
import { validate } from "../../../middleware/validation.middleware";
import {
  createAuditCycleSchema,
  updateAuditCycleSchema,
  assignAuditorSchema,
  submitResultSchema,
  listAuditQuerySchema,
  searchAuditQuerySchema,
  discrepancyReportQuerySchema,
} from "../validator/audit.validator";
import {
  AUDIT_PERMISSIONS,
} from "../constants/audit.constants";

const router = Router();
const controller = new AuditController();

router.use(authenticate as any);

router.post(
  "/",
  requirePermission(AUDIT_PERMISSIONS.CREATE) as any,
  validate(createAuditCycleSchema),
  controller.create
);

router.get(
  "/search",
  requirePermission(AUDIT_PERMISSIONS.READ) as any,
  validate(searchAuditQuerySchema) as any,
  controller.search
);

router.get(
  "/",
  requirePermission(AUDIT_PERMISSIONS.READ) as any,
  validate(listAuditQuerySchema) as any,
  controller.list
);

router.get(
  "/:id/dashboard",
  requirePermission(AUDIT_PERMISSIONS.READ) as any,
  controller.dashboard
);

router.get(
  "/:id/history",
  requirePermission(AUDIT_PERMISSIONS.READ) as any,
  controller.history
);

router.get(
  "/:id/discrepancies",
  requirePermission(AUDIT_PERMISSIONS.READ) as any,
  validate(discrepancyReportQuerySchema) as any,
  controller.discrepancyReport
);

router.get(
  "/:id",
  requirePermission(AUDIT_PERMISSIONS.READ) as any,
  controller.getById
);

router.patch(
  "/:id",
  requirePermission(AUDIT_PERMISSIONS.UPDATE) as any,
  validate(updateAuditCycleSchema),
  controller.update
);

router.post(
  "/:id/assign",
  requirePermission(AUDIT_PERMISSIONS.ASSIGN) as any,
  validate(assignAuditorSchema),
  controller.assign
);

router.post(
  "/:id/close",
  requirePermission(AUDIT_PERMISSIONS.CLOSE) as any,
  controller.close
);

router.patch(
  "/assignments/:assignmentId/start",
  requirePermission(AUDIT_PERMISSIONS.UPDATE) as any,
  controller.start
);

router.post(
  "/assignments/:assignmentId/results",
  requirePermission(AUDIT_PERMISSIONS.UPDATE) as any,
  validate(submitResultSchema),
  controller.submitResult
);

router.patch(
  "/results/:resultId/verify",
  requirePermission(AUDIT_PERMISSIONS.UPDATE) as any,
  controller.verifyResult
);

router.patch(
  "/results/:resultId/missing",
  requirePermission(AUDIT_PERMISSIONS.UPDATE) as any,
  controller.markMissing
);

router.patch(
  "/results/:resultId/damaged",
  requirePermission(AUDIT_PERMISSIONS.UPDATE) as any,
  controller.markDamaged
);

export default router;
