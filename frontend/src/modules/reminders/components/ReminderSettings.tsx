import { useState } from 'react';
import {
  Stack,
  Group,
  Switch,
  NumberInput,
  Text,
  Badge,
  Collapse,
  Box,
  ThemeIcon,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import {
  IconBell,
  IconMail,
  IconSend,
  IconCalendarClock,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconRepeat,
} from '@tabler/icons-react';
import { SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { SettingRowSkeleton } from '@/components/Skeleton/SettingRowSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { notify } from '@/components/Notification';
import { useGetReminderSettings, useUpdateReminderSetting, type ReminderSetting } from '../api';
import { useTranslation } from 'react-i18next';

type TriggerKey = ReminderSetting['trigger_type'];
type ChannelKey = Exclude<ReminderSetting['channel'], 'dashboard'>;

const TRIGGERS: TriggerKey[] = ['cycle_deadline', 'contract_ending'];
const CHANNELS: ChannelKey[] = ['inapp', 'email'];

export function ReminderSettings() {
  const { t } = useTranslation();
  const TRIGGER_META: Record<
    TriggerKey,
    { label: string; description: string; icon: React.ReactNode; color: string }
  > = {
    cycle_deadline: {
      label: t('settings.reminders.upcomingCycleDeadline'),
      description: t('settings.reminders.upcomingCycleDeadlineDescription'),
      icon: <IconCalendarClock size={16} />,
      color: 'blue',
    },
    contract_ending: {
      label: t('settings.reminders.expiringContract'),
      description: t('settings.reminders.expiringContractDescription'),
      icon: <IconAlertTriangle size={16} />,
      color: 'yellow',
    },
  };
  const CHANNEL_META: Record<ChannelKey, { label: string; icon: React.ReactNode; color: string }> =
    {
      inapp: {
        label: t('settings.reminders.inApp'),
        icon: <IconBell size={14} />,
        color: 'violet',
      },
      email: {
        label: t('settings.reminders.email'),
        icon: <IconMail size={14} />,
        color: 'blue',
      },
    };
  const { data: settings = [], isLoading: _loading } = useGetReminderSettings();
  const isLoading = useDelayedLoading(_loading);
  const updateMutation = useUpdateReminderSetting();
  const [expandedTrigger, setExpandedTrigger] = useState<TriggerKey | null>(null);

  const getSetting = (trigger: TriggerKey, ch: ChannelKey) =>
    settings.find((s) => s.trigger_type === trigger && s.channel === ch);

  const handleToggle = async (trigger: TriggerKey, channel: ChannelKey, enabled: boolean) => {
    const nid = notify.loading(t('settings.reminders.saving'));
    try {
      await updateMutation.mutateAsync({ trigger_type: trigger, channel, is_enabled: enabled });
      notify.success(nid, { message: t('settings.reminders.saved') });
    } catch (e: any) {
      notify.error(nid, {
        message: e?.response?.data?.message || t('settings.reminders.saveFailed'),
      });
    }
  };

  const handleConfig = async (
    trigger: TriggerKey,
    field: 'days_before' | 'repeat_interval_days',
    val: number | string,
  ) => {
    const days = typeof val === 'number' ? val : parseInt(String(val), 10);
    if (isNaN(days) || days < 1) return;
    try {
      await updateMutation.mutateAsync({ trigger_type: trigger, channel: 'inapp', [field]: days });
    } catch {}
  };

  if (isLoading)
    return (
      <Stack gap="md">
        <SectionLabel>{t('settings.reminders.title')}</SectionLabel>
        <SettingRowSkeleton rows={3} />
      </Stack>
    );

  return (
    <Stack gap="md">
      <SectionLabel>{t('settings.reminders.title')}</SectionLabel>

      <SettingsCard>
        {TRIGGERS.map((trigger, i) => {
          const meta = TRIGGER_META[trigger];
          const isExpanded = expandedTrigger === trigger;
          const isLast = i === TRIGGERS.length - 1;
          const inappSetting = getSetting(trigger, 'inapp');
          const daysBefore = inappSetting?.days_before ?? 7;
          const repeatInterval = inappSetting?.repeat_interval_days ?? 1;
          const anyEnabled = CHANNELS.some((ch) => getSetting(trigger, ch)?.is_enabled ?? true);

          return (
            <Box key={trigger}>
              <Group
                justify="space-between"
                align="center"
                py="sm"
                px="md"
                wrap="nowrap"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedTrigger(isExpanded ? null : trigger)}
              >
                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <ThemeIcon
                    variant="light"
                    color={meta.color}
                    size="md"
                    radius="sm"
                    style={{ flexShrink: 0 }}
                  >
                    {meta.icon}
                  </ThemeIcon>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={500} lh={1.3}>
                      {meta.label}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.4}>
                      {meta.description}
                    </Text>
                  </Box>
                </Group>

                <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Badge size="xs" variant="dot" color={anyEnabled ? 'green' : 'gray'} radius="sm">
                    {anyEnabled ? t('common.active') : t('common.inactive')}
                  </Badge>
                  {anyEnabled && (
                    <Text size="xs" c="dimmed">
                      {t('settings.reminders.everyDays', {
                        days: daysBefore,
                        repeat: repeatInterval,
                      })}
                    </Text>
                  )}
                  <ThemeIcon size="sm" variant="subtle" color="gray" radius="sm">
                    {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </ThemeIcon>
                </Group>
              </Group>

              <Collapse in={isExpanded}>
                <Box px="md" pb="sm" pt={4} style={{ background: 'var(--mantine-color-gray-0)' }}>
                  <Group gap="xl" mb="sm" align="center">
                    <Group gap="xs" align="center" wrap="nowrap">
                      <IconClock size={13} color="var(--mantine-color-dimmed)" />
                      <Text size="xs" c="dimmed">
                        {t('settings.reminders.notifyWithin')}
                      </Text>
                      <NumberInput
                        size="xs"
                        min={1}
                        max={60}
                        w={56}
                        value={daysBefore}
                        onBlur={(e) => handleConfig(trigger, 'days_before', e.target.value)}
                        onChange={(val) => handleConfig(trigger, 'days_before', val)}
                      />
                      <Text size="xs" c="dimmed">
                        {t('settings.reminders.daysBefore')}
                      </Text>
                    </Group>
                    <Group gap="xs" align="center" wrap="nowrap">
                      <IconRepeat size={13} color="var(--mantine-color-dimmed)" />
                      <Text size="xs" c="dimmed">
                        {t('settings.reminders.repeatEvery')}
                      </Text>
                      <NumberInput
                        size="xs"
                        min={1}
                        max={30}
                        w={56}
                        value={repeatInterval}
                        onBlur={(e) =>
                          handleConfig(trigger, 'repeat_interval_days', e.target.value)
                        }
                        onChange={(val) => handleConfig(trigger, 'repeat_interval_days', val)}
                      />
                      <Text size="xs" c="dimmed">
                        {t('settings.reminders.days')}
                      </Text>
                    </Group>
                  </Group>

                  <SimpleGrid cols={2} spacing="xs">
                    {CHANNELS.map((ch) => {
                      const setting = getSetting(trigger, ch);
                      const enabled = setting?.is_enabled ?? true;
                      const chMeta = CHANNEL_META[ch];
                      return (
                        <Group
                          key={ch}
                          justify="space-between"
                          align="center"
                          px="sm"
                          py={6}
                          style={{
                            background: 'var(--mantine-color-white)',
                            borderRadius: 6,
                            border: '1px solid var(--mantine-color-gray-2)',
                            opacity: enabled ? 1 : 0.55,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <Group gap="xs" wrap="nowrap">
                            <ThemeIcon
                              size="xs"
                              variant="light"
                              color={enabled ? chMeta.color : 'gray'}
                              radius="sm"
                            >
                              {chMeta.icon}
                            </ThemeIcon>
                            <Text size="xs" fw={500}>
                              {chMeta.label}
                            </Text>
                          </Group>
                          <Switch
                            size="xs"
                            checked={enabled}
                            disabled={updateMutation.isPending}
                            onChange={(e) => handleToggle(trigger, ch, e.currentTarget.checked)}
                          />
                        </Group>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              </Collapse>

              {!isLast && <Divider />}
            </Box>
          );
        })}
      </SettingsCard>

      <SectionLabel>{t('settings.reminders.systemEmails')}</SectionLabel>

      <SettingsCard>
        {[
          {
            icon: <IconSend size={16} />,
            color: 'green',
            label: t('settings.reminders.welcomeEmail'),
            description: t('settings.reminders.welcomeEmailDescription'),
            badge: t('settings.reminders.welcomeEmailBadge'),
          },
          {
            icon: <IconMail size={16} />,
            color: 'blue',
            label: t('settings.reminders.reminderEmail'),
            description: t('settings.reminders.reminderEmailDescription'),
            badge: t('settings.reminders.reminderEmailBadge'),
          },
        ].map((item, i, arr) => (
          <Box key={i}>
            <Group px="md" py="sm" gap="sm" wrap="nowrap">
              <ThemeIcon
                variant="light"
                color={item.color}
                size="md"
                radius="sm"
                style={{ flexShrink: 0 }}
              >
                {item.icon}
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {item.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.description}
                </Text>
                <Badge size="xs" variant="outline" color="gray" mt={4}>
                  {item.badge}
                </Badge>
              </Box>
            </Group>
            {i < arr.length - 1 && <Divider />}
          </Box>
        ))}
      </SettingsCard>
    </Stack>
  );
}
