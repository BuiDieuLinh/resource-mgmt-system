export const ROUTES = {
  home: '',
  employees: 'employees',
  departments: 'departments',
  positions: 'positions',
  orgChart: 'employees/org-chart',
  employeeProfile: (id: string) => `employees/${id}/profile`,

  attendance: 'attendance',
  checkInOut: 'attendance/check-in',
  timesheet: 'timesheet',
  attendanceDetail: (empId: string, month: number, year: number) =>
    `attendance/employee/${empId}?month=${month}&year=${year}`,

  leaveRequests: 'leave-requests',
  myLeaveRequests: 'my/leave-requests',
  myTimesheet: 'my/timesheet',
  myProfile: 'my/profile',

  settings: 'settings',

  performanceCycles: 'performance/cycles',
  cycleDetail: (id: string) => `performance/cycles/${id}`,
  performanceReview: 'performance/review',
} as const;

export const AUTH_ROUTES = {
  login: 'login',
  forgotPassword: 'forgot-password',
  appLauncher: 'apps',
} as const;
