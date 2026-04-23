import { ActionIcon, Group } from '@mantine/core';
import { MonthPickerInput as MantineMonthPickerInput } from '@mantine/dates';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface MonthNavigatorProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export default function MonthNavigator({ value, onChange }: MonthNavigatorProps) {
  const handleMonthChange = (d: string | null) => {
    if (d) {
      onChange(new Date(d));
    } else {
      onChange(null);
    }
  };

  const goToPreviousMonth = () => {
    const prev = new Date(value || new Date());
    prev.setMonth(prev.getMonth() - 1);
    onChange(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(value || new Date());
    next.setMonth(next.getMonth() + 1);
    onChange(next);
  };

  return (
    <Group>
      <ActionIcon title="Previous" variant="light" onClick={goToPreviousMonth}>
        <IconChevronLeft size={18} />
      </ActionIcon>
      <MantineMonthPickerInput
        leftSection={<IconCalendar size={20} stroke={1.5} />}
        leftSectionPointerEvents="none"
        valueFormat="MMM YYYY"
        value={value}
        onChange={handleMonthChange}
      />
      <ActionIcon title="Next" variant="light" onClick={goToNextMonth}>
        <IconChevronRight size={18} />
      </ActionIcon>
    </Group>
  );
}
