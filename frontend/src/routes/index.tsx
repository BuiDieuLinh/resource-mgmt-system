import { createBrowserRouter } from "react-router-dom";
import Home from "../modules/home/views/Home";
import Layout from "../modules/app/Layout";
import { Employee } from "../modules";
import { employeeUrl } from "./url";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Home/>,
      },
      {
        path: employeeUrl,
        element: <Employee/>,
      },
    ],
  },
]);
