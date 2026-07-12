import { PriorityLevel } from "@prisma/client";

export const NOTIFICATION_TYPES = [
  "MAINTENANCE_APPROVED",
  "MAINTENANCE_REJECTED",
  "MAINTENANCE_COMPLETED",
  "AUDIT_ASSIGNED",
  "AUDIT_COMPLETED",
  "AUDIT_DISCREPANCY",
  "REPORT_READY",
  "SYSTEM_ALERT",
  "GENERIC",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationTemplate {
  name: string;
  type: string;
  subject: string;
  body: string;
  channels: ("EMAIL" | "IN_APP" | "PUSH" | "SMS")[];
}

export const TEMPLATES: Record<string, NotificationTemplate> = {
  MAINTENANCE_APPROVED: {
    name: "Maintenance Approved",
    type: "MAINTENANCE_APPROVED",
    subject: "Maintenance request approved",
    body: "<p>Hello {{recipientName}},</p><p>Your maintenance request for <strong>{{assetName}}</strong> has been <strong>approved</strong>.</p>",
    channels: ["EMAIL", "IN_APP", "PUSH"],
  },
  MAINTENANCE_REJECTED: {
    name: "Maintenance Rejected",
    type: "MAINTENANCE_REJECTED",
    subject: "Maintenance request rejected",
    body: "<p>Hello {{recipientName}},</p><p>Your maintenance request for <strong>{{assetName}}</strong> has been <strong>rejected</strong>.</p>",
    channels: ["EMAIL", "IN_APP", "PUSH"],
  },
  MAINTENANCE_COMPLETED: {
    name: "Maintenance Completed",
    type: "MAINTENANCE_COMPLETED",
    subject: "Maintenance completed",
    body: "<p>Hello {{recipientName}},</p><p>The maintenance work for <strong>{{assetName}}</strong> has been <strong>completed</strong>.</p>",
    channels: ["EMAIL", "IN_APP", "PUSH"],
  },
  AUDIT_ASSIGNED: {
    name: "Audit Assigned",
    type: "AUDIT_ASSIGNED",
    subject: "You have been assigned an audit",
    body: "<p>Hello {{recipientName}},</p><p>You have been assigned the audit <strong>{{entityName}}</strong>.</p>",
    channels: ["EMAIL", "IN_APP", "PUSH"],
  },
  AUDIT_COMPLETED: {
    name: "Audit Completed",
    type: "AUDIT_COMPLETED",
    subject: "Audit completed",
    body: "<p>Hello {{recipientName}},</p><p>The audit <strong>{{entityName}}</strong> has been <strong>completed</strong>.</p>",
    channels: ["EMAIL", "IN_APP"],
  },
  AUDIT_DISCREPANCY: {
    name: "Audit Discrepancy",
    type: "AUDIT_DISCREPANCY",
    subject: "Audit discrepancy detected",
    body: "<p>Hello {{recipientName}},</p><p>A discrepancy was detected during the audit <strong>{{entityName}}</strong>.</p>",
    channels: ["EMAIL", "IN_APP", "PUSH", "SMS"],
  },
  REPORT_READY: {
    name: "Report Ready",
    type: "REPORT_READY",
    subject: "Your report is ready",
    body: "<p>Hello {{recipientName}},</p><p>The report <strong>{{entityName}}</strong> is now ready to view.</p>",
    channels: ["EMAIL", "IN_APP"],
  },
  SYSTEM_ALERT: {
    name: "System Alert",
    type: "SYSTEM_ALERT",
    subject: "System alert",
    body: "<p>Hello {{recipientName}},</p><p>{{message}}</p>",
    channels: ["EMAIL", "IN_APP", "PUSH"],
  },
  GENERIC: {
    name: "Generic Notification",
    type: "GENERIC",
    subject: "Notification",
    body: "<p>Hello {{recipientName}},</p><p>{{message}}</p>",
    channels: ["IN_APP"],
  },
};

/**
 * Determines whether a given time falls within a user's configured quiet hours.
 * Quiet hours are expressed as "HH:MM" strings (24h). If the start is after the
 * end (e.g. 22:00 -> 07:00) the quiet window wraps past midnight.
 */
export function isWithinQuietHours(pref: {
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}): boolean {
  if (!pref.quietHoursStart || !pref.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = pref.quietHoursStart.split(":").map((n) => parseInt(n, 10));
  const [endH, endM] = pref.quietHoursEnd.split(":").map((n) => parseInt(n, 10));

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
    return false;
  }

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  // Wraps past midnight (e.g. 22:00 -> 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export const DEFAULT_NOTIFICATION_PRIORITY = PriorityLevel.MEDIUM;
