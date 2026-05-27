import { Stack, Tabs } from '@mantine/core';
import { IconShieldCheck, IconCalendarEvent, IconTemplate, IconBell } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { WorkPolicySettings } from '@/modules/work-policies/components/WorkPolicySettings';
import { HolidaySettings } from '@/modules/holidays/components/HolidaySettings';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { EMPLOYEE_ROLE } from '@/constant';
import EvaluationTemplatesPage from '@/modules/performance/views/EvaluationTemplates';
import { ReminderSettings } from '@/modules/reminders/components/ReminderSettings';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR].includes(r as any),
  );

  return (
    <Stack gap="md">
      <PageHeader title={t('pages.settingsTitle')} description={t('pages.settingsDescription')} />

      <Tabs defaultValue="work-policy" variant="outline">
        <Tabs.List mb="lg">
          {isAdmin && (
            <Tabs.Tab value="work-policy" leftSection={<IconShieldCheck size={16} />}>
              {t('settings.tabs.workPolicies')}
            </Tabs.Tab>
          )}
          {isAdmin && (
            <Tabs.Tab value="holidays" leftSection={<IconCalendarEvent size={16} />}>
              {t('settings.tabs.publicHolidays')}
            </Tabs.Tab>
          )}
          {isAdmin && (
            <Tabs.Tab value="evaluation-templates" leftSection={<IconTemplate size={16} />}>
              {t('settings.tabs.evaluationTemplates')}
            </Tabs.Tab>
          )}
          {isAdmin && (
            <Tabs.Tab value="reminders" leftSection={<IconBell size={16} />}>
              {t('settings.tabs.notifications')}
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
        {isAdmin && (
          <Tabs.Panel value="evaluation-templates">
            <EvaluationTemplatesPage />
          </Tabs.Panel>
        )}
        {isAdmin && (
          <Tabs.Panel value="reminders">
            <ReminderSettings />
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
}
