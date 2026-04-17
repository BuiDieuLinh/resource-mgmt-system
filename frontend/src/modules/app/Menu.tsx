import { EMPLOYEE_ROLE } from '@/constant';
import {
  employeeListUrl,
  employeeDepartmentsUrl,
  employeePositionsUrl,
  attendanceUrl,
  timesheetUrl,
  leaveRequestUrl,
  settingsUrl,
  checkInOutUrl,
  myLeaveRequestUrl,
  myTimesheetUrl,
  performanceCyclesUrl,
  performanceReviewUrl,
} from '@/routes/url';
import {
  IconGauge,
  IconUsers,
  IconSettings,
  IconTimelineEvent,
  IconBuilding,
  IconBriefcase,
  IconCalendarOff,
  IconLogin,
  IconClock,
  IconTrophy,
  IconStar,
} from '@tabler/icons-react';

export type AppMenu = {
  label: string;
  icon?: any;
  path?: string;
  children?: AppMenu[];
  roles?: string[];
};

export const MENUS: AppMenu[] = [
  { label: 'Dashboard', icon: IconGauge, path: '/' },
  {
    label: 'Employees',
    icon: IconUsers,
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
    children: [
      { label: 'Employee List', path: employeeListUrl, icon: IconUsers },
      { label: 'Departments', path: employeeDepartmentsUrl, icon: IconBuilding },
      { label: 'Positions', path: employeePositionsUrl, icon: IconBriefcase },
    ],
  },
  {
    label: 'Attendance',
    icon: IconTimelineEvent,
    children: [
      { label: 'Check In / Out', path: checkInOutUrl, icon: IconLogin },
      { label: 'Overview', path: attendanceUrl, roles: [EMPLOYEE_ROLE.ADMIN] },
      {
        label: 'Timesheet',
        path: timesheetUrl,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
      },
      { label: 'My Timesheet', path: myTimesheetUrl, icon: IconClock },
    ],
  },
  {
    label: 'Leave',
    icon: IconCalendarOff,
    children: [
      {
        label: 'Leave Requests',
        path: leaveRequestUrl,
        icon: IconCalendarOff,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'My Leave Request',
        path: myLeaveRequestUrl,
        icon: IconCalendarOff,
      },
    ],
  },
  {
    label: 'Performance',
    icon: IconTrophy,
    children: [
      {
        label: 'Review Cycles',
        path: performanceCyclesUrl,
        icon: IconTrophy,
        roles: [EMPLOYEE_ROLE.ADMIN],
      },
      {
        label: 'Performance Review',
        path: performanceReviewUrl,
        icon: IconStar,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
      },
    ],
  },
  { label: 'Settings', icon: IconSettings, path: settingsUrl },
];
