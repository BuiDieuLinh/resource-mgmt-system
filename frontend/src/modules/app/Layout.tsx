import { AppShell, Group, Text, Avatar } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { AppBreadcrumbs } from "./Breadcumb";
import { Navbar } from "./Navbar";

export default function AdminLayout() {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 210, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700}>RMS</Text>
          <Avatar radius="xl">U</Avatar>
        </Group>
      </AppShell.Header>

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
