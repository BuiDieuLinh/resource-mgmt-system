import {
  employeeListUrl,
  employeeDepartmentsUrl,
  employeePositionsUrl,
  attendanceUrl,
  timesheetUrl,
} from '@/routes/url';
import {
  IconGauge,
  IconUsers,
  IconSettings,
  IconTimelineEvent,
  IconBuilding,
  IconBriefcase,
} from '@tabler/icons-react';

export type AppMenu = {
  label: string;
  icon?: any;
  path?: string;
  children?: AppMenu[];
};

export const MENUS: AppMenu[] = [
  {
    label: 'Dashboard',
    icon: IconGauge,
    path: '/',
  },
  {
    label: 'Employees',
    icon: IconUsers,
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
      { label: 'Overview', path: attendanceUrl },
      { label: 'Timesheet', path: timesheetUrl },
    ],
  },
  {
    label: 'Settings',
    icon: IconSettings,
    children: [
      { label: 'General', path: '/settings' },
      { label: 'Security', path: '/settings/security' },
    ],
  },
];
