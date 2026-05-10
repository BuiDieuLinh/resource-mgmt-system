import type {
  IEmployeePayload,
  ILeaveRequestPayload,
  IReviewCyclePayload,
  IAwardPayload,
  IWorkPolicyPayload,
  IHolidayPayload,
  IDepartmentPayload,
  IPositionPayload,
} from '../models';

const uid = () => Date.now().toString().slice(-6);

export const EMPLOYEE_CREATE_DATA = {
  code: `AUTOTEST${uid()}`,
  fullName: `[Auto-Test] Employee ${uid()}`,
  email: `autotest.${uid()}@company.com`,
  phone: `090${uid()}`,
  idCard: `${uid()}${uid().slice(-3)}`,
  address: '123 Test Street, Test City',
};

export function makeEmployeePayload(
  fullName: string,
  positionId: string,
  managerId: string,
  overrides: Partial<IEmployeePayload> = {},
): IEmployeePayload {
  return {
    employee_code: `AUTO_TEST_EMP_000`,
    full_name: fullName,
    display_name: `Test ${uid()}`,
    email: `autotest.10@company.com`,
    phone: `090${uid()}`,
    identify_card: `ID${uid()}${uid().slice(-3)}`,
    gender: 'Male',
    date_of_birth: '1995-01-15',
    address: '123 Test Street, Test City',
    hire_date: '2024-06-01',
    position_id: positionId,
    manager_id: managerId,
    status: 'active',
    work_schedules: [
      { day_of_week: 0, start_time: 480, end_time: 1020 },
      { day_of_week: 1, start_time: 480, end_time: 1020 },
      { day_of_week: 2, start_time: 480, end_time: 1020 },
      { day_of_week: 3, start_time: 480, end_time: 1020 },
      { day_of_week: 4, start_time: 480, end_time: 1020 },
    ],
    ...overrides,
  };
}

export const DEPARTMENT_DATA: IDepartmentPayload = {
  department_code: 'TEST_DEPT_001',
  department_name: 'Test Department',
  description: 'Created by automation test',
};

export function makePositionPayload(departmentId: string): IPositionPayload {
  return {
    position_name: 'Test Position',
    level: 'mid',
    description: 'Created by automation test',
    department_id: departmentId,
  };
}

export function makeLeaveRequestPayload(
  employeeId: string,
  overrides: Partial<ILeaveRequestPayload> = {},
): ILeaveRequestPayload {
  return {
    employee_id: employeeId,
    leave_type: 'annual',
    start_date: '2026-09-01',
    end_date: '2026-09-02',
    reason: '[TEST] Automation test leave request',
    ...overrides,
  };
}

export const LEAVE_FORM_DATA = {
  annual: {
    leaveType: 'Annual Leave',
    startDate: '01/09/2026',
    endDate: '02/09/2026',
    reason: '[TEST] Annual leave automation',
  },
  sick: {
    leaveType: 'Sick Leave',
    startDate: '01/09/2026',
    endDate: '01/09/2026',
    reason: '[TEST] Sick leave automation',
  },
} as const;

export const CYCLE_DATA: IReviewCyclePayload = {
  title: 'TEST Cycle Q3 2026',
  period_type: 'quarterly',
  period_year: 2026,
  period_seq: 3,
  announce_date: '2026-10-01',
};

export const CYCLE_MONTHLY_DATA: IReviewCyclePayload = {
  title: 'TEST Cycle Aug 2026',
  period_type: 'monthly',
  period_year: 2026,
  period_seq: 8,
  announce_date: '2026-09-01',
};

export const CYCLE_FORM_DATA = {
  quarterly: {
    title: 'TEST Cycle Q3 2026',
    type: 'Quarterly',
    year: '2026',
    seq: '3',
    announceDate: '01/10/2026',
  },
  monthly: {
    title: 'TEST Cycle Aug 2026',
    type: 'Monthly',
    year: '2026',
    seq: '8',
    announceDate: '01/09/2026',
  },
} as const;

export const REVIEW_FORM_DATA = {
  score: '85',
  comment: '[TEST] Good performance during the review period.',
  achievements: '[TEST] Completed all assigned tasks on time.',
} as const;

export function makeAwardPayload(
  cycleId: string,
  employeeId: string,
  overrides: Partial<IAwardPayload> = {},
): IAwardPayload {
  return {
    cycle_id: cycleId,
    employee_id: employeeId,
    category: 'top_employee',
    rank: 1,
    title: '[TEST] Outstanding Employee Award',
    description: '[TEST] Exceptional performance and dedication.',
    ...overrides,
  };
}

export const WORK_POLICY_DATA: IWorkPolicyPayload = {
  is_flexible_enabled: true,
  flexible_start: 15,
  flexible_end: 15,
  break_start: 720,
  break_end: 780,
  effective_from: '2026-01-01',
};

export const HOLIDAY_DATA: IHolidayPayload = {
  name: '[TEST] Automation Test Holiday',
  holiday_date: '2026-12-25',
  description: 'Created by automation test',
  is_paid: true,
};

export const CHECKIN_COORDS = {
  latitude: 21.027763,
  longitude: 105.83416,
} as const;
