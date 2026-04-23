import { Stack, Tabs, Switch } from '@mantine/core';
import {
  IconShieldCheck,
  IconCalendarEvent,
  IconSettings2,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { SettingRow, SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { WorkPolicySettings } from '@/modules/work-policies/components/WorkPolicySettings';
import { HolidaySettings } from '@/modules/holidays/components/HolidaySettings';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { EMPLOYEE_ROLE } from '@/constant';

function PreferencesSection() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack gap="md">
      <SectionLabel>Appearance</SectionLabel>
      <SettingsCard>
        <SettingRow
          icon={isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
          color={isDark ? 'yellow' : 'indigo'}
          title="Dark mode"
          description={isDark ? 'Currently using dark theme' : 'Currently using light theme'}
          noDivider
          right={
            <Switch
              checked={isDark}
              onChange={toggleColorScheme}
              size="sm"
              onLabel={<IconSun size={13} />}
              offLabel={<IconMoon size={13} />}
            />
          }
        />
      </SettingsCard>
    </Stack>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN].includes(r as any),
  );

  return (
    <Stack gap="md">
      <PageHeader title="Settings" description="System configuration and preferences" />

      <Tabs defaultValue="preferences" variant="outline">
        <Tabs.List mb="lg">
          <Tabs.Tab value="preferences" leftSection={<IconSettings2 size={16} />}>
            Preferences
          </Tabs.Tab>
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

        <Tabs.Panel value="preferences">
          <PreferencesSection />
        </Tabs.Panel>
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
