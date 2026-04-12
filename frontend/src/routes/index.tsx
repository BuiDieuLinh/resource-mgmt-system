import { createBrowserRouter } from 'react-router-dom';
import Home from '../modules/home/views/Home';
import Layout from '../modules/app/Layout';
import { Employee } from '../modules';
import {
  employeeListUrl,
  employeeDepartmentsUrl,
  employeePositionsUrl,
  employeeOrgChartUrl,
  employeeProfileUrl,
  attendanceUrl,
  timesheetUrl,
  attendanceDetailUrl,
  leaveRequestUrl,
  settingsUrl,
  myLeaveRequestUrl,
  myTimesheetUrl,
  myProfileUrl,
} from './url';
import Error404 from '../components/ErrorPage/Error404';
import Error401 from '../components/ErrorPage/Error401';
import Error403 from '../components/ErrorPage/Error403';
import ErrorTokenExpired from '../components/ErrorPage/ErrorTokenExpired';
import OrgChart from '@/modules/employees/views/OrgChart';
import Departments from '@/modules/departments/views/Departments';
import Positions from '@/modules/positions/views/Positions';
import EmployeeProfile from '@/modules/employees/views/EmployeeProfile';
import Attendance from '@/modules/attendances/views/Attendances';
import Timesheet from '@/modules/attendances/views/Timesheet';
import AttendanceDetail from '@/modules/attendances/views/AttendanceDetail';
import LeaveRequests from '@/modules/leave-requests/views/LeaveRequests';
import MyLeaveRequests from '@/modules/leave-requests/views/MyLeaveRequests';
import MyTimesheet from '@/modules/attendances/views/MyTimesheet';
import MyProfile from '@/modules/employees/views/MyProfile';
import Settings from '@/modules/settings/views/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            path: '',
            element: <Home />,
          },
          {
            path: employeeListUrl,
            element: <Employee />,
          },
          {
            path: employeeDepartmentsUrl,
            element: <Departments />,
          },
          {
            path: employeePositionsUrl,
            element: <Positions />,
          },
          {
            path: employeeOrgChartUrl,
            element: <OrgChart />,
          },
          {
            path: employeeProfileUrl,
            element: <EmployeeProfile />,
          },
          {
            path: attendanceUrl,
            element: <Attendance />,
          },
          {
            path: timesheetUrl,
            element: <Timesheet />,
          },
          {
            path: attendanceDetailUrl,
            element: <AttendanceDetail />,
          },
          { path: leaveRequestUrl, element: <LeaveRequests /> },
          { path: myLeaveRequestUrl, element: <MyLeaveRequests /> },
          { path: myTimesheetUrl, element: <MyTimesheet /> },
          { path: myProfileUrl, element: <MyProfile /> },
          { path: settingsUrl, element: <Settings /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Error404 />,
  },
  { path: '/401', element: <Error401 /> },
  { path: '/403', element: <Error403 /> },
  { path: '/session-expired', element: <ErrorTokenExpired /> },
]);
