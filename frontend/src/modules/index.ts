import { lazyLoad } from "../utils/loadable";

export const Layout = lazyLoad(
    () => import("./app/Layout"),
    (module) => module.default,
)

export const Home = lazyLoad(
  () => import("./home/views/Home"),
  (m) => m.default
);

export const Employee = lazyLoad(
  () => import("./employees/views/Employees"),
  (m) => m.default
);

