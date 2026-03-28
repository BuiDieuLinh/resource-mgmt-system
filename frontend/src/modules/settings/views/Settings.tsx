import { useState } from 'react';
import { Stack, Tabs, Switch, SegmentedControl } from '@mantine/core';
import {
  IconShieldCheck,
  IconCalendarEvent,
  IconSettings2,
  IconSun,
  IconMoon,
  IconLanguage,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { SettingRow, SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { WorkPolicySettings } from '@/modules/work-policies/components/WorkPolicySettings';
import { HolidaySettings } from '@/modules/holidays/components/HolidaySettings';

function PreferencesSection() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [lang, setLang] = useState('vi');
  const isDark = colorScheme === 'dark';

  return (
    <Stack gap="md">
      <SectionLabel>Appearance</SectionLabel>
      <SettingsCard>
        <SettingRow
          icon={isDark ? <IconSun size={15} /> : <IconMoon size={15} />}
          color={isDark ? 'yellow' : 'indigo'}
          title="Dark mode"
          description={isDark ? 'Currently using dark theme' : 'Currently using light theme'}
          noDivider
          right={
            <Switch
              checked={isDark}
              onChange={toggleColorScheme}
              size="sm"
              onLabel={<IconSun size={11} />}
              offLabel={<IconMoon size={11} />}
            />
          }
        />
      </SettingsCard>

      <SectionLabel>Language</SectionLabel>
      <SettingsCard>
        <SettingRow
          icon={<IconLanguage size={15} />}
          color="teal"
          title="Display language"
          description="Choose the language for the interface"
          noDivider
          right={
            <SegmentedControl
              size="xs"
              value={lang}
              onChange={setLang}
              data={[
                { label: 'Tiếng Việt', value: 'vi' },
                { label: 'English', value: 'en' },
              ]}
            />
          }
        />
      </SettingsCard>
    </Stack>
  );
}

export default function SettingsPage() {
  return (
    <Stack gap="md">
      <PageHeader title="Settings" description="System configuration and preferences" />

      <Tabs defaultValue="preferences" variant="outline">
        <Tabs.List mb="lg">
          <Tabs.Tab value="preferences" leftSection={<IconSettings2 size={14} />}>
            Preferences
          </Tabs.Tab>
          <Tabs.Tab value="work-policy" leftSection={<IconShieldCheck size={14} />}>
            Work Policies
          </Tabs.Tab>
          <Tabs.Tab value="holidays" leftSection={<IconCalendarEvent size={14} />}>
            Public Holidays
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="preferences">
          <PreferencesSection />
        </Tabs.Panel>
        <Tabs.Panel value="work-policy">
          <WorkPolicySettings />
        </Tabs.Panel>
        <Tabs.Panel value="holidays">
          <HolidaySettings />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
