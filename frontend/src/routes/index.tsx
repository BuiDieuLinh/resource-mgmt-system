import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from '../modules/home/views/Home';
import Layout from '../modules/app/Layout';
import { Employee } from '../modules';
import {
  employeeListUrl,
  employeeDepartmentsUrl,
  employeeOrgChartUrl,
  employeeProfileUrl,
  attendanceUrl,
  attendanceDetailUrl,
  leaveRequestUrl,
  settingsUrl,
  checkInOutUrl,
  myTimesheetUrl,
  myProfileUrl,
} from './url';
import Error404 from '../components/ErrorPage/Error404';
import Error401 from '../components/ErrorPage/Error401';
import Error403 from '../components/ErrorPage/Error403';
import ErrorTokenExpired from '../components/ErrorPage/ErrorTokenExpired';
import OrgChart from '@/modules/employees/views/OrgChart';
import Departments from '@/modules/departments/views/Departments';
import EmployeeProfile from '@/modules/employees/views/EmployeeProfile';
import Attendance from '@/modules/attendances/views/Attendances';
import AttendanceDetail from '@/modules/attendances/views/AttendanceDetail';
import CheckInOut from '@/modules/attendances/views/CheckInOut';
import LeaveRequests from '@/modules/leave-requests/views/LeaveRequests';
import MyTimesheet from '@/modules/attendances/views/MyTimesheet';
import MyProfile from '@/modules/employees/views/MyProfile';
import MyReviews from '@/modules/performance/views/MyReviews';
import Settings from '@/modules/settings/views/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import PerformanceCycles from '@/modules/performance/views/PerformanceCycles';
import EvaluationTemplates from '@/modules/performance/views/EvaluationTemplates';
import CycleDetail from '@/modules/performance/views/CycleDetail';
import PerformanceReview from '@/modules/performance/views/PerformanceReview';
import {
  performanceTemplatesUrl,
  performanceCyclesUrl,
  performanceCycleDetailUrl,
  performanceReviewUrl,
  myReviewsUrl,
} from './url';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { EMPLOYEE_ROLE } from '@/constant';

function RoleBasedRedirect() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  if (roles.includes(EMPLOYEE_ROLE.ADMIN) || roles.includes(EMPLOYEE_ROLE.SUPER_ADMIN)) {
    return <Home />;
  }

  if (roles.includes(EMPLOYEE_ROLE.MANAGER)) {
    return <Navigate to={employeeListUrl} replace />;
  }

  return <Navigate to={checkInOutUrl} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: '', element: <RoleBasedRedirect /> },
          { path: employeeListUrl, element: <Employee /> },
          { path: employeeDepartmentsUrl, element: <Departments /> },
          { path: employeeOrgChartUrl, element: <OrgChart /> },
          { path: employeeProfileUrl, element: <EmployeeProfile /> },
          { path: attendanceUrl, element: <Attendance /> },
          { path: attendanceDetailUrl, element: <AttendanceDetail /> },
          { path: leaveRequestUrl, element: <LeaveRequests /> },
          { path: checkInOutUrl, element: <CheckInOut /> },
          { path: myTimesheetUrl, element: <MyTimesheet /> },
          { path: myProfileUrl, element: <MyProfile /> },
          { path: myReviewsUrl, element: <MyReviews /> },
          { path: settingsUrl, element: <Settings /> },
          { path: performanceTemplatesUrl, element: <EvaluationTemplates /> },
          { path: performanceCyclesUrl, element: <PerformanceCycles /> },
          { path: performanceCycleDetailUrl, element: <CycleDetail /> },
          { path: performanceReviewUrl, element: <PerformanceReview /> },
        ],
      },
    ],
  },
  { path: '*', element: <Error404 /> },
  { path: '/401', element: <Error401 /> },
  { path: '/403', element: <Error403 /> },
  { path: '/session-expired', element: <ErrorTokenExpired /> },
]);
