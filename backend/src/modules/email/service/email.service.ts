import { EmailRepository } from "../repository/email.repository";
import { NotFoundError, ConflictError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { Mailer } from "../../../utils/mailer";

export class EmailService {
  private repository = new EmailRepository();

  private renderTemplate(content: string, data: Record<string, any>): string {
    return content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
      const value = data[key];
      return value === undefined || value === null ? "" : String(value);
    });
  }

  public async listTemplates(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const filters = {
      category: query.category,
      isActive:
        query.isActive === undefined
          ? undefined
          : query.isActive === "true" || query.isActive === true,
    };

    const templates = await this.repository.findMany(filters);
    const total = templates.length;
    const start = (page - 1) * limit;
    const data = templates.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getTemplateById(id: string) {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundError("Email template not found");
    }
    return template;
  }

  public async createTemplate(companyId: string, data: any, currentUserId: string) {
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new ConflictError("Email template with this name already exists");
    }

    const template = await this.repository.create({
      name: data.name,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      bodyText: data.bodyText ?? null,
      variables: data.variables ?? null,
      category: data.category,
      isActive: data.isActive ?? true,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "EMAIL_TEMPLATE_CREATED",
      entityType: "EmailTemplate",
      entityId: template.id,
      entityName: template.name,
      newValue: template,
    });

    return template;
  }

  public async updateTemplate(companyId: string, id: string, data: any, currentUserId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Email template not found");
    }

    if (data.name && data.name !== existing.name) {
      const dup = await this.repository.findByName(data.name);
      if (dup) {
        throw new ConflictError("Email template with this name already exists");
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.bodyHtml !== undefined) updateData.bodyHtml = data.bodyHtml;
    if (data.bodyText !== undefined) updateData.bodyText = data.bodyText;
    if (data.variables !== undefined) updateData.variables = data.variables;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const template = await this.repository.update(id, updateData);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "EMAIL_TEMPLATE_UPDATED",
      entityType: "EmailTemplate",
      entityId: template.id,
      entityName: template.name,
      oldValue: existing,
      newValue: template,
    });

    return template;
  }

  public async deleteTemplate(companyId: string, id: string, currentUserId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Email template not found");
    }

    await this.repository.delete(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "EMAIL_TEMPLATE_DELETED",
      entityType: "EmailTemplate",
      entityId: id,
      entityName: existing.name,
      oldValue: existing,
    });

    return { id };
  }

  public async previewTemplate(id: string, data: Record<string, any>) {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundError("Email template not found");
    }

    const sampleData = data || {};
    const subject = this.renderTemplate(template.subject, sampleData);
    const html = this.renderTemplate(template.bodyHtml, sampleData);
    const text = template.bodyText ? this.renderTemplate(template.bodyText, sampleData) : null;

    return { subject, html, text };
  }

  public async sendTemplateEmail(companyId: string, data: any, currentUserId: string) {
    const template = await this.repository.findByName(data.templateName);
    if (!template) {
      throw new NotFoundError("Email template not found");
    }

    const sampleData = data.data || {};
    const subject = this.renderTemplate(template.subject, sampleData);
    const html = this.renderTemplate(template.bodyHtml, sampleData);

    await Mailer.sendEmail(data.to, subject, html);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: "EMAIL_SENT",
      entityType: "EmailTemplate",
      entityId: template.id,
      entityName: template.name,
      metadata: { to: data.to, subject },
    });

    return { to: data.to, subject, templateName: template.name };
  }
}
