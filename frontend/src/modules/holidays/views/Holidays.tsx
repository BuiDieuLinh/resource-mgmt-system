import { useState } from 'react';
import { Stack, Group, Button, Badge, Text, Select, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconCalendarEvent } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { notify } from '@/components/Notification';
import { Loading } from '@/components/Loading/Loading';
import ErrorState from '@/components/ErrorState/ErrorState';
import { formatDate } from '@/constant';
import { useGetHolidays } from '../api/get-holidays';
import { useCreateHoliday } from '../api/create-holiday';
import { useUpdateHoliday } from '../api/update-holiday';
import { useDeleteHoliday } from '../api/delete-holiday';
import { HolidayFormModal } from '../components/HolidayFormModal';
import type { IHoliday, IHolidayPayload } from '../types';

export default function HolidaysPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [opened, setOpened] = useState(false);
  const [editHoliday, setEditHoliday] = useState<IHoliday | null>(null);

  const { data, isLoading, error, refetch } = useGetHolidays({ year });
  const holidays = data?.data ?? [];

  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const isEdit = Boolean(editHoliday);

  const openAdd = () => {
    setEditHoliday(null);
    setOpened(true);
  };
  const openEdit = (h: IHoliday) => {
    setEditHoliday(h);
    setOpened(true);
  };
  const handleClose = () => {
    setOpened(false);
    setEditHoliday(null);
  };

  const handleSubmit = async (payload: IHolidayPayload, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating...' : 'Creating...');
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      notify.success(notiId, { message: isEdit ? 'Holiday updated' : 'Holiday created' });
      handleClose();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Save failed' });
    }
  };

  const handleDelete = async (id: string) => {
    const notiId = notify.loading('Deleting...');
    try {
      await deleteMutation.mutateAsync(id);
      notify.success(notiId, { message: 'Holiday deleted' });
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Delete failed' });
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(new Date().getFullYear() - 1 + i);
    return { value: y, label: y };
  });

  const columns: TableColumn<IHoliday>[] = [
    {
      key: 'holiday_date',
      title: 'Date',
      sortable: true,
      render: (r) => formatDate(r.holiday_date),
    },
    { key: 'name', title: 'Name', sortable: true },
    {
      key: 'description',
      title: 'Description',
      render: (r) => (
        <Text size="sm" c="dimmed">
          {r.description || '—'}
        </Text>
      ),
    },
    {
      key: 'is_paid',
      title: 'Paid',
      align: 'center',
      render: (r) => (
        <Badge variant="light" color={r.is_paid ? 'green' : 'gray'} size="sm">
          {r.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'center',
      render: (r) => (
        <Group gap={4} justify="center">
          <Tooltip label="Edit" withArrow>
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openEdit(r)}>
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow>
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(r.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <Stack gap="md">
      <PageHeader
        title="Public Holidays"
        description="Manage public holidays — used to validate leave requests"
        right={
          <Group>
            <Select w={100} data={yearOptions} value={year} onChange={(v) => v && setYear(v)} />
            <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
              Add Holiday
            </Button>
          </Group>
        }
      />

      {isLoading ? (
        <Loading />
      ) : holidays.length === 0 ? (
        <Stack align="center" py="xl" gap="xs">
          <IconCalendarEvent size={40} color="#adb5bd" />
          <Text c="dimmed">No holidays for {year}</Text>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Add Holiday
          </Button>
        </Stack>
      ) : (
        <BaseTable data={holidays} columns={columns} height={520} />
      )}

      <HolidayFormModal
        opened={opened}
        onClose={handleClose}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={editHoliday}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Stack>
  );
}
