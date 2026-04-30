import { Stack, Tabs } from '@mantine/core';
import { IconShieldCheck, IconCalendarEvent } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { WorkPolicySettings } from '@/modules/work-policies/components/WorkPolicySettings';
import { HolidaySettings } from '@/modules/holidays/components/HolidaySettings';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { EMPLOYEE_ROLE } from '@/constant';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN].includes(r as any),
  );

  return (
    <Stack gap="md">
      <PageHeader title="Settings" description="System configuration" />

      <Tabs defaultValue="work-policy" variant="outline">
        <Tabs.List mb="lg">
          {isAdmin && (
            <Tabs.Tab value="work-policy" leftSection={<IconShieldCheck size={16} />}>
              Work Policies
            </Tabs.Tab>
          )}
          {isAdmin && (
            <Tabs.Tab value="holidays" leftSection={<IconCalendarEvent size={16} />}>
              Public Holidays
            </Tabs.Tab>
          )}
        </Tabs.List>

        {isAdmin && (
          <Tabs.Panel value="work-policy">
            <WorkPolicySettings />
          </Tabs.Panel>
        )}
        {isAdmin && (
          <Tabs.Panel value="holidays">
            <HolidaySettings />
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
}
