// import {
//   IconGauge,
//   IconUsers,
//   IconSettings,
// } from "@tabler/icons-react";
// import { ScrollArea } from "@mantine/core";
// import classes from "./Navbar.module.css";
// import { NavbarLink } from "./Navbar";
// import { employeeUrl } from "../../routes/url";

// const menus = [
//   {
//     label: "Dashboard",
//     icon: IconGauge,
//     path: "/",
//   },
//   {
//     label: "Employees",
//     icon: IconUsers,
//     path: employeeUrl,
//   },
//   {
//     label: "Settings",
//     icon: IconSettings,
//     path: "/settings",
//   },
// ];

// export function Navbar() {
//   return (
//     <nav className={classes.navbar}>
//       <ScrollArea>
//         {menus.map((item) => (
//           <NavbarLink key={item.label} {...item} />
//         ))}
//       </ScrollArea>
//     </nav>
//   );
// }
import {
  IconGauge,
  IconUsers,
  IconSettings,
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
      { label: 'List', path: '/employees' },
      { label: 'Profile', path: '/employees/profile' },
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
