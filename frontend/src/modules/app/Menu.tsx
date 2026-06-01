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
  labelKey?: string;
  icon?: any;
  path?: string;
  children?: AppMenu[];
  roles?: string[];
};

export const MENUS: AppMenu[] = [
  {
    label: 'Dashboard',
    labelKey: 'nav.dashboard',
    icon: IconGauge,
    path: '/',
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
  },
  {
    label: 'Employees',
    labelKey: 'nav.employees',
    icon: IconUsers,
    children: [
      {
        label: 'Employee List',
        labelKey: 'nav.employeeList',
        path: employeeListUrl,
        icon: IconUsers,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'Departments',
        labelKey: 'nav.departments',
        path: employeeDepartmentsUrl,
        icon: IconBuilding,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
      },
    ],
  },
  {
    label: 'Attendance',
    labelKey: 'nav.attendance',
    icon: IconTimelineEvent,
    children: [
      {
        label: 'Check In / Out',
        labelKey: 'nav.checkInOut',
        path: checkInOutUrl,
        icon: IconLogin,
        roles: [
          EMPLOYEE_ROLE.ADMIN,
          EMPLOYEE_ROLE.HR,
          EMPLOYEE_ROLE.MANAGER,
          EMPLOYEE_ROLE.EMPLOYEE,
        ],
      },
      {
        label: 'Overview',
        labelKey: 'nav.overview',
        path: attendanceUrl,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
      },
      {
        label: 'My Timesheet',
        labelKey: 'nav.myTimesheet',
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
    labelKey: 'nav.leaveRequests',
    icon: IconCalendarOff,
    path: leaveRequestUrl,
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR, EMPLOYEE_ROLE.MANAGER, EMPLOYEE_ROLE.EMPLOYEE],
  },
  {
    label: 'Performance',
    labelKey: 'nav.performance',
    icon: IconTrophy,
    children: [
      {
        label: 'Review Cycles',
        labelKey: 'nav.reviewCycles',
        path: performanceCyclesUrl,
        icon: IconTrophy,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
      },
      {
        label: 'Performance Review',
        labelKey: 'nav.performanceReview',
        path: performanceReviewUrl,
        icon: IconStar,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'My Reviews',
        labelKey: 'nav.myReviews',
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
    labelKey: 'nav.settings',
    icon: IconSettings,
    path: settingsUrl,
    roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR],
  },
];
