import { lazyLoad } from '../utils/loadable';

export const Layout = lazyLoad(
  () => import('./app/Layout'),
  (module) => module.default,
);

export const Home = lazyLoad(
  () => import('./home/views/Home'),
  (m) => m.default,
);

export const Employee = lazyLoad(
  () => import('./employees/views/Employees'),
  (m) => m.default,
);

export const Attendance = lazyLoad(
  () => import('./attendances/views/Attendances'),
  (m) => m.default,
);

export const Timesheet = lazyLoad(
  () => import('./attendances/views/Timesheet'),
  (m) => m.default,
);

export const LeaveRequests = lazyLoad(
  () => import('./leave-requests/views/LeaveRequests'),
  (m) => m.default,
);
