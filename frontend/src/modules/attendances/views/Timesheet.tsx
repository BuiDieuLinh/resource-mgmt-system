import { useState, useMemo } from 'react';
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Badge,
  Avatar,
  Flex,
  Center,
  Loader,
} from '@mantine/core';
import { IconDownload, IconMapPin, IconRoute } from '@tabler/icons-react';

import MonthNavigator from '../components/MonthPickerInput';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { formatHours } from '../utils/format';
import { useGetAttendances } from '../api/get-attendances';

type TimesheetRow = {
  id: string;
  employee_name: string;
  date: string;
  check_in: string;
  check_out: string;
  hours: number;
  late: number;
  location: string;
  distance: number;
  status: string;
};

export default function TimesheetPage() {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());

  const { data: rawData = [], isLoading } = useGetAttendances({
    month: selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1,
    year: selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear(),
  });

  console.log('Raw attendance data:', rawData);

  const timesheetData: TimesheetRow[] = useMemo(() => {
    return rawData.map((r) => ({
      id: r.id,
      employee_name: r.employee?.full_name || r.employee_id,
      date: (r as any).work_date || r.date,
      // Provide empty string fallback if time is not available yet
      check_in:
        (r as any).check_in_time || r.check_in
          ? new Date((r as any).check_in_time || r.check_in).toLocaleTimeString('vn-VN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
            })
          : '',
      check_out:
        (r as any).check_out_time || r.check_out
          ? new Date((r as any).check_out_time || r.check_out).toLocaleTimeString('vn-VN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
            })
          : '',
      hours: r.over_time || 0, // Fallback for demonstration, a real logic would calc diff between in and out
      late: r.late || 0,
      location: (r as any).check_in_place || 'Office',
      distance: 0,
      status: r.status || 'Pending',
    }));
  }, [rawData]);

  const columns: TableColumn<TimesheetRow>[] = [
    {
      key: 'employee_name',
      title: 'Employee',
      sortable: true,
      render: (r: TimesheetRow) => (
        <Flex align="center" gap="sm">
          <Avatar size="sm" radius="xl" color="blue">
            {r.employee_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </Avatar>
          <Text fw={500}>{r.employee_name}</Text>
        </Flex>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      sortAccessor: (r: TimesheetRow) => new Date(r.date).getTime(),
      render: (r: TimesheetRow) => (
        <Text size="sm">
          {new Date(r.date).toLocaleDateString('vn-VN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      ),
    },
    {
      key: 'check_in',
      title: 'Check-in',
      align: 'center',
      render: (r: TimesheetRow) => (
        <Badge color="blue" variant="light">
          {r.check_in || '-'}
        </Badge>
      ),
    },
    {
      key: 'check_out',
      title: 'Check-out',
      align: 'center',
      render: (r: TimesheetRow) => (
        <Badge color="red" variant="light">
          {r.check_out || '-'}
        </Badge>
      ),
    },
    {
      key: 'hours',
      title: 'Hours',
      align: 'center',
      sortable: true,
      render: (r: TimesheetRow) => (
        <Badge tt="lowercase" color="green" variant="light">
          {formatHours(r.hours)}
        </Badge>
      ),
    },
    {
      key: 'late',
      title: 'Late',
      align: 'center',
      sortable: true,
      render: (r: TimesheetRow) => (
        <Badge tt="lowercase" color={r.late > 0 ? 'orange' : 'gray'} variant="light">
          {r.late} m
        </Badge>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      render: (r: TimesheetRow) => (
        <Group gap="xs">
          <IconMapPin size={16} />
          <Text size="sm">{r.location}</Text>
        </Group>
      ),
    },
    {
      key: 'distance',
      title: 'Distance',
      align: 'center',
      sortable: true,
      render: (r: TimesheetRow) => (
        <Group gap={4} justify="center">
          <IconRoute size={16} />
          <Text size="sm" fw={500}>
            {r.distance} km
          </Text>
        </Group>
      ),
    },
  ];

  const totalHours = useMemo(() => timesheetData.reduce((a, b) => a + b.hours, 0), [timesheetData]);

  const lateCount = useMemo(() => timesheetData.filter((r) => r.late > 0).length, [timesheetData]);

  const employeeCount = useMemo(
    () => new Set(timesheetData.map((r) => r.employee_name)).size,
    [timesheetData],
  );

  const handleExport = () => {
    let csv = 'Employee,Date,Check-in,Check-out,Hours,Late,Location,Distance,Status\n';

    timesheetData.forEach((r) => {
      csv += `${r.employee_name},${r.date},${r.check_in},${r.check_out},${r.hours},${r.late},${r.location},${r.distance},${r.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${selectedMonth?.toISOString().slice(0, 10)}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Stack gap="lg">
      <Group justify="apart">
        <Title order={2}>Timesheet</Title>

        <Group>
          <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} />

          <Button leftSection={<IconDownload size={16} />} variant="light" onClick={handleExport}>
            Export
          </Button>
        </Group>
      </Group>

      <Group grow>
        <Card shadow="sm" p="md">
          <Text size="sm" c="dimmed">
            Total Working Hours
          </Text>
          <Title order={3}>{formatHours(totalHours)}</Title>
        </Card>

        <Card shadow="sm" p="md">
          <Text size="sm" c="dimmed">
            Late Records
          </Text>
          <Title order={3}>{lateCount}</Title>
        </Card>

        <Card shadow="sm" p="md">
          <Text size="sm" c="dimmed">
            Employees
          </Text>
          <Title order={3}>{employeeCount}</Title>
        </Card>
      </Group>

      {isLoading ? (
        <Center style={{ height: 300 }}>
          <Loader />
        </Center>
      ) : (
        <BaseTable
          data={timesheetData}
          columns={columns}
          height={520}
          striped
          highlightOnHover
          withCheckbox
        />
      )}
    </Stack>
  );
}
