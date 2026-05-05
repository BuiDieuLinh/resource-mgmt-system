import { EMPLOYEE_ROLE } from '@/constant';
import {
  employeeListUrl,
  employeeDepartmentsUrl,
  employeePositionsUrl,
  attendanceUrl,
  leaveRequestUrl,
  settingsUrl,
  checkInOutUrl,
  myTimesheetUrl,
  myReviewsUrl,
  performanceCyclesUrl,
  performanceReviewUrl,
  reportsHrStructureUrl,
  reportsTurnoverUrl,
  reportsInsightsUrl,
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
  IconChartBar,
  IconChartLine,
  IconBulb,
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
  },
  {
    label: 'Employees',
    icon: IconUsers,
    children: [
      {
        label: 'Employee List',
        path: employeeListUrl,
        icon: IconUsers,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'Departments',
        path: employeeDepartmentsUrl,
        icon: IconBuilding,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
      },
      {
        label: 'Positions',
        path: employeePositionsUrl,
        icon: IconBriefcase,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
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
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
      },
      {
        label: 'My Timesheet',
        path: myTimesheetUrl,
        icon: IconClock,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER, EMPLOYEE_ROLE.EMPLOYEE],
      },
    ],
  },
  {
    label: 'Leave Requests',
    icon: IconCalendarOff,
    path: leaveRequestUrl,
    roles: [
      EMPLOYEE_ROLE.SUPER_ADMIN,
      EMPLOYEE_ROLE.ADMIN,
      EMPLOYEE_ROLE.MANAGER,
      EMPLOYEE_ROLE.EMPLOYEE,
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
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
      },
      {
        label: 'Performance Review',
        path: performanceReviewUrl,
        icon: IconStar,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'My Reviews',
        path: myReviewsUrl,
        icon: IconClipboardList,
        roles: [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER, EMPLOYEE_ROLE.EMPLOYEE],
      },
    ],
  },
  {
    label: 'Reports',
    icon: IconChartBar,
    children: [
      {
        label: 'HR Structure',
        path: reportsHrStructureUrl,
        icon: IconChartBar,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.MANAGER],
      },
      {
        label: 'Turnover Report',
        path: reportsTurnoverUrl,
        icon: IconChartLine,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
      },
      {
        label: 'Insights',
        path: reportsInsightsUrl,
        icon: IconBulb,
        roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
      },
    ],
  },
  {
    label: 'Settings',
    icon: IconSettings,
    path: settingsUrl,
    roles: [EMPLOYEE_ROLE.SUPER_ADMIN, EMPLOYEE_ROLE.ADMIN],
  },
];
