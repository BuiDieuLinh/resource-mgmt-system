import { useState } from 'react';
import { Stack, Group, Button, Badge, ActionIcon, Tooltip, Box, Text, Select } from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendarEvent,
  IconCalendar,
} from '@tabler/icons-react';
import { notify } from '@/components/Notification';
import { formatDate } from '@/constant';
import { SettingRow, SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { SettingRowSkeleton } from '@/components/Skeleton/SettingRowSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useConfirm } from '@/hooks/useConfirm';
import { useGetHolidays } from '../api/get-holidays';
import { useCreateHoliday } from '../api/create-holiday';
import { useUpdateHoliday } from '../api/update-holiday';
import { useDeleteHoliday } from '../api/delete-holiday';
import { HolidayFormModal } from './HolidayFormModal';
import type { IHoliday, IHolidayPayload } from '../types';
import { useTranslation } from 'react-i18next';

export function HolidaySettings() {
  const { t } = useTranslation();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [opened, setOpened] = useState(false);
  const [editHoliday, setEditHoliday] = useState<IHoliday | null>(null);
  const { data, isLoading: _loading } = useGetHolidays({ year });
  const isLoading = useDelayedLoading(_loading);
  const holidays = data?.data ?? [];
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();
  const isEdit = Boolean(editHoliday);

  const { confirm, ConfirmComponent } = useConfirm();

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(new Date().getFullYear() - 1 + i);
    return { value: y, label: y };
  });

  const handleSubmit = async (payload: IHolidayPayload, id?: string) => {
    const notiId = notify.loading(
      isEdit ? t('settings.holidays.updating') : t('settings.holidays.creating'),
    );
    try {
      if (isEdit && id) await updateMutation.mutateAsync({ id, payload });
      else await createMutation.mutateAsync(payload);
      notify.success(notiId, {
        message: isEdit
          ? t('settings.holidays.updateSuccess')
          : t('settings.holidays.createSuccess'),
      });
      setOpened(false);
      setEditHoliday(null);
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || t('settings.holidays.saveFailed'),
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: t('settings.holidays.deleteTitle'),
      message: t('settings.holidays.deleteMessage', { name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      type: 'delete',
      onConfirm: async () => {
        const notiId = notify.loading(t('settings.holidays.deleting'));
        try {
          await deleteMutation.mutateAsync(id);
          notify.success(notiId, { message: t('settings.holidays.deleteSuccess') });
        } catch (e: any) {
          notify.error(notiId, {
            message: e?.response?.data?.message || t('settings.holidays.deleteFailed'),
          });
        }
      },
    });
  };

  if (isLoading)
    return (
      <Stack gap="md">
        <SectionLabel>{t('settings.holidays.title')}</SectionLabel>
        <SettingRowSkeleton rows={5} />
      </Stack>
    );

  return (
    <Stack gap="md">
      <SectionLabel
        action={
          <Group gap="xs">
            <Select
              checkIconPosition="right"
              size="xs"
              w={84}
              data={yearOptions}
              value={year}
              onChange={(v) => v && setYear(v)}
            />
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={15} />}
              onClick={() => {
                setEditHoliday(null);
                setOpened(true);
              }}
            >
              {t('settings.holidays.add')}
            </Button>
          </Group>
        }
      >
        {t('settings.holidays.title')} - {year}
      </SectionLabel>

      <SettingsCard>
        {holidays.length === 0 ? (
          <Box py="xl" ta="center">
            <IconCalendarEvent size={30} color="#adb5bd" style={{ margin: '0 auto 6px' }} />
            <Text size="sm" c="dimmed">
              {t('settings.holidays.noHolidays', { year })}
            </Text>
          </Box>
        ) : (
          holidays.map((h, i) => (
            <SettingRow
              key={h.id}
              icon={<IconCalendar size={16} />}
              color="orange"
              title={h.name}
              description={formatDate(h.holiday_date)}
              noDivider={i === holidays.length - 1}
              right={
                <Group gap={4}>
                  <Badge size="xs" variant="light" color={h.is_paid ? 'teal' : 'gray'} radius="sm">
                    {h.is_paid ? t('settings.holidays.paid') : t('settings.holidays.unpaid')}
                  </Badge>
                  <Tooltip label={t('common.edit')} withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditHoliday(h);
                        setOpened(true);
                      }}
                    >
                      <IconEdit size={15} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('common.delete')} withArrow>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(h.id, h.name);
                      }}
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              }
            />
          ))
        )}
      </SettingsCard>

      <HolidayFormModal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditHoliday(null);
        }}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={editHoliday}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmComponent />
    </Stack>
  );
}
