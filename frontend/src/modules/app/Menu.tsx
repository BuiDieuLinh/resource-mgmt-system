import { EMPLOYEE_ROLE } from '@/constant';
import {
  employeeListUrl,
  employeeDepartmentsUrl,
  attendanceUrl,
  leaveRequestUrl,
  settingsUrl,
  checkInOutUrl,
  myTimesheetUrl,
  myReviewsUrl,
  performanceCyclesUrl,
  performanceReviewUrl,
} from '@/routes/url';
import {
  IconGauge,
  IconUsers,
  IconSettings,
  IconTimelineEvent,
  IconBuilding,
  IconCalendarOff,
  IconLogin,
  IconClock,
  IconTrophy,
  IconStar,
  IconClipboardList,
} from '@tabler/icons-react';

export type AppMenu = {
  label: string;
  icon?: any;
  path?: string;
  children?: AppMenu[];
  roles?: string[];
};

export const MENUS: AppMenu[] = [
  {
    label: 'Dashboard',
    icon: IconGauge,
    path: '/',
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
  },
  {
    label: 'Employees',
    icon: IconUsers,
    children: [
      {
        label: 'Employee List',
        path: employeeListUrl,
        icon: IconUsers,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'Departments',
        path: employeeDepartmentsUrl,
        icon: IconBuilding,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
      },
    ],
  },
  {
    label: 'Attendance',
    icon: IconTimelineEvent,
    children: [
      {
        label: 'Check In / Out',
        path: checkInOutUrl,
        icon: IconLogin,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER, EMPLOYEE_ROLE.EMPLOYEE],
      },
      {
        label: 'Overview',
        path: attendanceUrl,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
      },
      {
        label: 'My Timesheet',
        path: myTimesheetUrl,
        icon: IconClock,
        roles: [
          EMPLOYEE_ROLE.ADMIN,
          EMPLOYEE_ROLE.HR,
          EMPLOYEE_ROLE.MANAGER,
          EMPLOYEE_ROLE.EMPLOYEE,
        ],
      },
    ],
  },
  {
    label: 'Leave Requests',
    icon: IconCalendarOff,
    path: leaveRequestUrl,
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR, EMPLOYEE_ROLE.MANAGER, EMPLOYEE_ROLE.EMPLOYEE],
  },
  {
    label: 'Performance',
    icon: IconTrophy,
    children: [
      {
        label: 'Review Cycles',
        path: performanceCyclesUrl,
        icon: IconTrophy,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
      },
      {
        label: 'Performance Review',
        path: performanceReviewUrl,
        icon: IconStar,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'My Reviews',
        path: myReviewsUrl,
        icon: IconClipboardList,
        roles: [
          EMPLOYEE_ROLE.ADMIN,
          EMPLOYEE_ROLE.HR,
          EMPLOYEE_ROLE.MANAGER,
          EMPLOYEE_ROLE.EMPLOYEE,
        ],
      },
    ],
  },
  {
    label: 'Settings',
    icon: IconSettings,
    path: settingsUrl,
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
  },
];
