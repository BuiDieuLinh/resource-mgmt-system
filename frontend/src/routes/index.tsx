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
} from './url';
import Error404 from '../components/ErrorPage/Error404';
import OrgChart from '@/modules/employees/views/OrgChart';
import Departments from '@/modules/departments/views/Departments';
import Positions from '@/modules/positions/views/Positions';
import EmployeeProfile from '@/modules/employees/views/EmployeeProfile';

export const router = createBrowserRouter([
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
    ],
  },
  {
    path: '*',
    element: <Error404 />,
  },
]);
