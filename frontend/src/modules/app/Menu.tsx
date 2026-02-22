import { employeeListUrl, employeeOrgChartUrl } from '@/routes/url';
import { IconGauge, IconUsers, IconSettings } from '@tabler/icons-react';

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
      { label: 'List', path: employeeListUrl },
      { label: 'Org Chart', path: employeeOrgChartUrl },
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
