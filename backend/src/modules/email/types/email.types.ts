export interface ListTemplateFilters {
  category?: string;
  isActive?: boolean;
}

export interface CreateTemplateInput {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  variables?: any;
  category: string;
  isActive?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string | null;
  variables?: any;
  category?: string;
  isActive?: boolean;
}

export interface PreviewInput {
  data?: Record<string, any>;
}

export interface SendEmailInput {
  to: string;
  templateName: string;
  data?: Record<string, any>;
}
