export const homeUrl = '/';
export const employeeListUrl = '/employees';
export const employeeDepartmentsUrl = '/departments';
export const employeePositionsUrl = '/positions';
export const employeeOrgChartUrl = '/employees/org-chart';
export const employeeProfileUrl = '/employees/:id/profile';
export const attendanceUrl = '/attendance';
export const attendanceFlowUrl = '/attendance/flow';
export const checkInOutUrl = '/attendance/check-in';
export const timesheetUrl = '/timesheet';
export const attendanceDetailUrl = '/attendance/employee/:employeeId';
export const buildAttendanceDetailUrl = (employeeId: string, month: number, year: number) =>
  `/attendance/employee/${employeeId}?month=${month}&year=${year}`;

export const leaveRequestUrl = '/leave-requests';
export const settingsUrl = '/settings';

export const myProfileUrl = '/my/profile';
export const myTimesheetUrl = '/my/timesheet';
export const myLeaveRequestUrl = '/my/leave-requests';
