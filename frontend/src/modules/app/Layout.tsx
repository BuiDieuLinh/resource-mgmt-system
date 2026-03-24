import { AppShell } from '@mantine/core';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AppShell navbar={{ width: collapsed ? 64 : 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar>
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
