import { prisma } from "../config/prisma";

export interface LogActivityParams {
  companyId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
  requestId?: string;
  durationMs?: number;
  status?: string;
  errorMessage?: string;
  metadata?: any;
}

export class ActivityLogger {
  public static async log(params: LogActivityParams): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          companyId: params.companyId,
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          entityName: params.entityName || null,
          oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : null,
          newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          deviceInfo: params.deviceInfo ? JSON.parse(JSON.stringify(params.deviceInfo)) : null,
          requestId: params.requestId || null,
          durationMs: params.durationMs || null,
          status: params.status || "SUCCESS",
          errorMessage: params.errorMessage || null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
        },
      });
    } catch (error) {
      console.error("[ActivityLogger Error]: Failed to write activity log:", error);
    }
  }
}
