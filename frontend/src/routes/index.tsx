import { createBrowserRouter } from 'react-router-dom';
import Home from '../modules/home/views/Home';
import Layout from '../modules/app/Layout';
import { Employee } from '../modules';
import { employeeListUrl, employeeOrgChartUrl } from './url';
import Error404 from '../components/error/Error404';
import OrgChart from '@/modules/employees/views/OrgChart';

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
        path: employeeOrgChartUrl,
        element: <OrgChart />,
      },
    ],
  },
  {
    path: '*',
    element: <Error404 />,
  },
]);
