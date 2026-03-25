import { Badge, Group } from '@mantine/core';
import { DAY_LIST } from '../../../constant';

interface WorkDayBadgesProps {
  days: number[];
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onToggle?: (dow: number) => void;
}

export function WorkDayBadges({ days, size = 'lg', onToggle }: WorkDayBadgesProps) {
  return (
    <Group gap={6}>
      {DAY_LIST.map(({ dow, label, isWeekend }) => {
        const active = days.includes(dow);
        return (
          <Badge
            key={dow}
            size={size}
            variant={active ? 'filled' : 'outline'}
            color={active ? (isWeekend ? 'grape' : 'deepPurple') : 'gray'}
            style={{
              opacity: active ? 1 : 0.3,
              minWidth: 50,
              cursor: onToggle ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            tt="capitalize"
            onClick={() => onToggle?.(dow)}
          >
            {label}
          </Badge>
        );
      })}
    </Group>
  );
}
