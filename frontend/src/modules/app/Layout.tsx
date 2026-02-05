import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { AppBreadcrumbs } from "./Breadcumb";
import { Navbar } from "./Navbar";

export default function AdminLayout() {
  return (
    <AppShell
      navbar={{ width: 210, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Navbar>
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <AppBreadcrumbs />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
