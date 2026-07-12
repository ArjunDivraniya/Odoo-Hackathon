import { NotificationRepository } from "../repository/notification.repository";
import { NotFoundError, BadRequestError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { cache } from "../../../utils/cache";
import { Mailer } from "../../../utils/mailer";
import { TEMPLATES, isWithinQuietHours } from "../constants/notification.constants";
import { NotificationStatus, PriorityLevel } from "@prisma/client";

const UNREAD_CACHE_TTL = 60;

export class NotificationService {
  private repository = new NotificationRepository();

  public async createNotification(data: any, companyId: string, currentUserId: string) {
    const preference = await this.repository.getPreference(data.userId);

    if (preference) {
      const mutedTypes: string[] = Array.isArray(preference.mutedTypes)
        ? (preference.mutedTypes as string[])
        : [];
      if (mutedTypes.includes(data.type)) {
        await ActivityLogger.log({
          companyId,
          userId: currentUserId,
          action: "NOTIFICATION_CREATED",
          entityType: "Notification",
          entityId: undefined,
          entityName: data.title,
          newValue: { ...data, skipped: "muted_type" },
        });
        return { skipped: true, reason: "muted", notification: null };
      }
      if (preference.inAppEnabled === false) {
        await ActivityLogger.log({
          companyId,
          userId: currentUserId,
          action: "NOTIFICATION_CREATED",
          entityType: "Notification",
          entityId: undefined,
          entityName: data.title,
          newValue: { ...data, skipped: "in_app_disabled" },
        });
        return { skipped: true, reason: "in_app_disabled", notification: null };
      }
    }

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const notification = await this.repository.createForUser({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority || PriorityLevel.MEDIUM,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      actionUrl: data.actionUrl ?? null,
      metadata: data.metadata,
      expiresAt,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "NOTIFICATION_CREATED",
      entityType: "Notification",
      entityId: notification.id,
      entityName: notification.title,
      newValue: notification,
    });

    return { skipped: false, notification };
  }

  public async getNotifications(currentUserId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters: any = {
      status: query.status,
      type: query.type,
      priority: query.priority,
      unreadOnly: query.unreadOnly,
    };

    if (query.dateFrom) {
      filters.dateFrom = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      filters.dateTo = new Date(query.dateTo);
    }

    const { notifications, total } = await this.repository.findManyForUser(
      currentUserId,
      filters,
      page,
      limit
    );

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getUnreadCount(currentUserId: string) {
    const cacheKey = `notif:unread:${currentUserId}`;
    const cached = await cache.get(cacheKey);
    if (cached !== null && cached !== undefined) {
      return { count: cached, cached: true };
    }

    const count = await this.repository.countUnread(currentUserId);
    await cache.set(cacheKey, count, UNREAD_CACHE_TTL);
    return { count, cached: false };
  }

  private async invalidateUnreadCache(userId: string) {
    await cache.delete(`notif:unread:${userId}`);
  }

  public async markRead(id: string, currentUserId: string) {
    const notification = await this.repository.findById(id, currentUserId);
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    await this.repository.markRead(id, currentUserId);
    await this.invalidateUnreadCache(currentUserId);
    return { success: true };
  }

  public async markAllRead(currentUserId: string) {
    const result = await this.repository.markAllRead(currentUserId);
    await this.invalidateUnreadCache(currentUserId);
    return { success: true, count: result.count };
  }

  public async deleteNotification(id: string, currentUserId: string) {
    const notification = await this.repository.findById(id, currentUserId);
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    await this.repository.softDelete(id, currentUserId);
    await this.invalidateUnreadCache(currentUserId);
    return { success: true };
  }

  public async getPreferences(currentUserId: string) {
    let preference = await this.repository.getPreference(currentUserId);
    if (!preference) {
      preference = await this.repository.upsertPreference(currentUserId, {});
    }
    return preference;
  }

  public async updatePreferences(currentUserId: string, data: any) {
    const preference = await this.repository.upsertPreference(currentUserId, data);
    return preference;
  }

  public async getTemplates() {
    return Object.values(TEMPLATES).map((t) => ({
      name: t.name,
      type: t.type,
      subject: t.subject,
      body: t.body,
      channels: t.channels,
    }));
  }

  public async sendEmailNotification(id: string, currentUserId: string, companyId: string) {
    const notification = await this.repository.findById(id, currentUserId);
    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    const preference = await this.repository.getPreference(notification.userId);
    if (preference && preference.emailEnabled === false) {
      throw new BadRequestError("Email notifications are disabled for this user");
    }

    const recipient = await this.repository.getUserById(notification.userId);
    if (!recipient || !recipient.email) {
      throw new NotFoundError("Recipient email not found");
    }

    const template = await this.repository.getEmailTemplateByType(notification.type);
    const fallback = TEMPLATES[notification.type] || TEMPLATES.GENERIC;

    const subject = template ? template.subject : fallback.subject;
    let bodyHtml = template ? template.bodyHtml : fallback.body;

    const metadata = (notification.metadata as Record<string, any>) || {};
    const recipientName = `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim() || recipient.email;

    const tokens: Record<string, string> = {
      recipientName,
      assetName: metadata.assetName || metadata.entityName || "your asset",
      entityName: metadata.entityName || "the entity",
      message: notification.message,
      title: notification.title,
      ...metadata,
    };

    for (const [key, value] of Object.entries(tokens)) {
      bodyHtml = bodyHtml.split(`{{${key}}}`).join(String(value));
    }

    await Mailer.sendEmail(recipient.email, subject, bodyHtml);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "NOTIFICATION_EMAIL_SENT",
      entityType: "Notification",
      entityId: notification.id,
      entityName: notification.title,
      newValue: { to: recipient.email, subject },
    });

    return { success: true, sentTo: recipient.email };
  }

  public async sendInApp(data: any, companyId: string, currentUserId: string) {
    const result = await this.createNotification(data, companyId, currentUserId);
    if (result.skipped) {
      return { skipped: true, reason: result.reason, notification: null };
    }
    return { skipped: false, notification: result.notification };
  }

  public isWithinQuietHours(pref: any): boolean {
    return isWithinQuietHours(pref);
  }
}
