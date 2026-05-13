export const EmployeeStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const CONTRACT_TYPE = {
  INTERN: 'intern',
  PROBATION: 'probation',
  OFFICIAL: 'official',
  PARTTIME: 'parttime',
} as const;

export type ContractType = (typeof CONTRACT_TYPE)[keyof typeof CONTRACT_TYPE];

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  intern: 'Intern',
  probation: 'Probation',
  official: 'Official',
  parttime: 'Part-time',
};

export const CONTRACT_TYPE_COLOR: Record<ContractType, string> = {
  intern: 'blue',
  probation: 'yellow',
  official: 'green',
  parttime: 'gray',
};

export const CONTRACT_TYPE_OPTIONS = Object.entries(CONTRACT_TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const LEAVE_TYPE = {
  ANNUAL: 'annual',
  SICK: 'sick',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  UNPAID: 'unpaid',
} as const;

export type LeaveType = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE];

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
};

export const LEAVE_TYPE_OPTIONS = Object.entries(LEAVE_TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const LEAVE_STATUS_OPTIONS = Object.entries(LEAVE_STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const ATTENDANCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_ACTION = {
  CHECKIN: 'check_in',
  CHECKOUT: 'check_out',
} as const;

export type AttendanceAction = (typeof ATTENDANCE_ACTION)[keyof typeof ATTENDANCE_ACTION];

export const DAY_LIST = [
  { dow: 0, label: 'Monday', isWeekend: false },
  { dow: 1, label: 'Tuesday', isWeekend: false },
  { dow: 2, label: 'Wednesday', isWeekend: false },
  { dow: 3, label: 'Thursday', isWeekend: false },
  { dow: 4, label: 'Friday', isWeekend: false },
  { dow: 5, label: 'Saturday', isWeekend: true },
  { dow: 6, label: 'Sunday', isWeekend: true },
] as const;

export const DEFAULT_WORK_DAYS = [0, 1, 2, 3, 4]; // Mon–Fri
export const DEFAULT_START_TIME = 480; // 08:00
export const DEFAULT_END_TIME = 1020; // 17:00

// Date formatting — dd, MMM yyyy e.g. 25, Mar 2026
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
  return `${day}, ${mon} ${year}`;
}

export const DATE_FORMAT = 'DD, MMM YYYY';

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = (minutes % 60).toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

export const LEVEL_OPTIONS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
];

export const LEVEL_POSITIONS = {
  JUNIOR: 'junior',
  MIDDLE: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  MANAGER: 'manager',
} as const;

export type LevelPosition = (typeof LEVEL_POSITIONS)[keyof typeof LEVEL_POSITIONS];

export const LEVEL_LABEL: Record<LevelPosition, string> = {
  junior: 'Junior',
  mid: 'Middle',
  senior: 'Senior',
  lead: 'Lead',
  manager: 'Manager',
};

export const LEVEL_COLOR: Record<LevelPosition, string> = {
  junior: 'teal',
  mid: 'blue',
  senior: 'violet',
  lead: 'orange',
  manager: 'red',
};

export const EMPLOYEE_ROLE = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_LOCALE = 'vi-VN';

export const SCORE_TYPE = {
  RATING: 'rating',
  BINARY: 'binary',
} as const;

export type ScoreType = (typeof SCORE_TYPE)[keyof typeof SCORE_TYPE];

export const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  rating: 'Rating',
  binary: 'Binary',
};

export const SCORE_TYPE_OPTIONS = Object.entries(SCORE_TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const REVIEW_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PUBLISHED: 'published',
} as const;

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  published: 'Published',
};

export const REVIEW_STATUS_COLOR: Record<ReviewStatus, string> = {
  draft: 'gray',
  submitted: 'blue',
  published: 'green',
};

export const REVIEW_PERIOD_TYPE = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
} as const;

export type ReviewPeriodType = (typeof REVIEW_PERIOD_TYPE)[keyof typeof REVIEW_PERIOD_TYPE];

export const REVIEW_PERIOD_TYPE_LABEL: Record<ReviewPeriodType, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

export const AWARD_CATEGORY = {
  TOP_EMPLOYEE: 'top_employee',
  TOP_MANAGER: 'top_manager',
} as const;

export type AwardCategory = (typeof AWARD_CATEGORY)[keyof typeof AWARD_CATEGORY];

export const AWARD_CATEGORY_LABEL: Record<AwardCategory, string> = {
  top_employee: 'Top Employee',
  top_manager: 'Top Manager',
};

export const PROBATION_RESULT = {
  PASS: 'pass',
  EXTEND: 'extend',
  FAIL: 'fail',
} as const;

export type ProbationResult = (typeof PROBATION_RESULT)[keyof typeof PROBATION_RESULT];

export const PROBATION_RESULT_LABEL: Record<ProbationResult, string> = {
  pass: 'Pass — Convert to Official',
  extend: 'Extend Probation',
  fail: 'Fail — Terminate',
};

export const INTERN_RESULT = {
  RECRUIT: 'recruit',
  NO_RECRUIT: 'no_recruit',
} as const;

export type InternResult = (typeof INTERN_RESULT)[keyof typeof INTERN_RESULT];

export const INTERN_RESULT_LABEL: Record<InternResult, string> = {
  recruit: 'Recruit — Create Offer',
  no_recruit: 'Do Not Recruit',
};
