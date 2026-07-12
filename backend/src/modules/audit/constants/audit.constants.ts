export const AUDIT_PERMISSIONS = {
  CREATE: "audit:create",
  READ: "audit:read",
  UPDATE: "audit:update",
  ASSIGN: "audit:assign",
  CLOSE: "audit:close",
} as const;

export const AUDIT_ENTITY_TYPE = "AuditCycle";

export const NOTIFICATION_TYPES = {
  AUDIT_ASSIGNED: "AUDIT_ASSIGNED",
  AUDIT_DISCREPANCY: "AUDIT_DISCREPANCY",
  AUDIT_COMPLETED: "AUDIT_COMPLETED",
} as const;

export const ACTIVITY_ACTIONS = {
  CYCLE_CREATED: "AUDIT_CYCLE_CREATED",
  ASSIGNED: "AUDIT_ASSIGNED",
  STARTED: "AUDIT_STARTED",
  RESULT_SUBMITTED: "AUDIT_RESULT_SUBMITTED",
  VERIFIED: "AUDIT_RESULT_VERIFIED",
  MISSING: "AUDIT_RESULT_MISSING",
  DAMAGED: "AUDIT_RESULT_DAMAGED",
  CLOSED: "AUDIT_CLOSED",
} as const;

export const RESULT_STATUS = {
  VERIFIED: "VERIFIED",
  MISSING: "MISSING",
  DAMAGED: "DAMAGED",
  MISMATCH: "MISMATCH",
  FOUND: "FOUND",
} as const;

/**
 * Maps an audit result status (or a boolean location mismatch) to the
 * discrepancy type that should be auto-created when a result is submitted.
 */
export const RESULT_STATUS_TO_DISCREPANCY: Record<string, string> = {
  [RESULT_STATUS.MISSING]: "ASSET_MISSING",
  [RESULT_STATUS.DAMAGED]: "ASSET_DAMAGED",
  [RESULT_STATUS.MISMATCH]: "LOCATION_MISMATCH",
};

export const DISCREPANCY_TYPE_LOCATION_MISMATCH = "LOCATION_MISMATCH";

export const DISCREPANCY_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export const DASHBOARD_CACHE_TTL = 120;
export const DASHBOARD_CACHE_PREFIX = "audit:dashboard:";
