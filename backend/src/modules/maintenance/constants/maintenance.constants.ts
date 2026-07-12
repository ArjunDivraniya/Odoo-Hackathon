import { MaintenanceStatus } from "@prisma/client";

/**
 * Allowed maintenance status transitions.
 * A request may only move to a status listed for its current status.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  REQUESTED: [MaintenanceStatus.APPROVED, MaintenanceStatus.REJECTED, MaintenanceStatus.CANCELLED],
  APPROVED: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.ON_HOLD, MaintenanceStatus.CANCELLED],
  IN_PROGRESS: [MaintenanceStatus.ON_HOLD, MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  ON_HOLD: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
  COMPLETED: [MaintenanceStatus.VERIFIED],
  VERIFIED: [],
  REJECTED: [],
  CANCELLED: [],
};

/** Statuses from which an editable request may still have its details updated. */
export const EDITABLE_STATUSES: MaintenanceStatus[] = [
  MaintenanceStatus.REQUESTED,
  MaintenanceStatus.ON_HOLD,
];

export const MAINTENANCE_NOTIFICATION_TYPES = {
  APPROVED: "MAINTENANCE_APPROVED",
  REJECTED: "MAINTENANCE_REJECTED",
  TECHNICIAN_ASSIGNED: "MAINTENANCE_TECHNICIAN_ASSIGNED",
  COMPLETED: "MAINTENANCE_COMPLETED",
  STATUS_UPDATED: "MAINTENANCE_STATUS_UPDATED",
} as const;

export const MAINTENANCE_ACTIVITY_ACTIONS = {
  CREATED: "MAINTENANCE_REQUESTED",
  UPDATED: "MAINTENANCE_UPDATED",
  APPROVED: "MAINTENANCE_APPROVED",
  REJECTED: "MAINTENANCE_REJECTED",
  TECHNICIAN_ASSIGNED: "MAINTENANCE_TECHNICIAN_ASSIGNED",
  STATUS_UPDATED: "MAINTENANCE_STATUS_UPDATED",
  COMPLETED: "MAINTENANCE_COMPLETED",
  ATTACHMENT_ADDED: "MAINTENANCE_ATTACHMENT_ADDED",
} as const;

export const MAINTENANCE_ENTITY_TYPE = "MaintenanceRequest";
