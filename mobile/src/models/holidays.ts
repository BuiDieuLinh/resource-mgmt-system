/**
 * Holiday Models
 */

export enum HolidayType {
  NATIONAL = 'national',
  COMPANY = 'company',
  SPECIAL = 'special',
}

export interface Holiday {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  holiday_type: HolidayType | string;
  description?: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GetHolidaysRequest {
  start_date?: string;
  end_date?: string;
  holiday_type?: string;
  page?: number;
  limit?: number;
}

export interface GetHolidaysResponse {
  data: Holiday[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
