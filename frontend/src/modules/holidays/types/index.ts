export interface IHoliday {
  id: string;
  name: string;
  holiday_date: string;
  description?: string | null;
  is_paid: boolean;
}

export interface IHolidayPayload {
  name: string;
  holiday_date: string;
  description?: string;
  is_paid?: boolean;
}
