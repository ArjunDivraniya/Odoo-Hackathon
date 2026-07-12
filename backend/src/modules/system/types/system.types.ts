export interface ListSettingsFilters {
  category?: string;
  key?: string;
  isPublic?: boolean;
}

export interface UpsertSettingInput {
  value: any;
  type?: string;
  category?: string;
  description?: string | null;
  isPublic?: boolean;
  validation?: any;
}

export interface ApplicationConfigInput {
  settings: Array<{
    key: string;
    value: any;
    type?: string;
    description?: string | null;
    isPublic?: boolean;
  }>;
}

export interface WorkingHourInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  isWorkingDay?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string | null;
}

export interface HolidayInput {
  officeId?: string | null;
  name: string;
  date: string;
  endDate?: string | null;
  type?: string;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface ListHolidayFilters {
  officeId?: string;
  year?: number;
  isActive?: boolean;
}
