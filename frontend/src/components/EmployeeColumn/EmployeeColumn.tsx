import { Anchor, Avatar, Group, Stack, Text, Tooltip, Badge } from '@mantine/core';

interface EmployeeColumnProps {
  employee?: {
    id?: string;
    employee_id?: string;
    full_name?: string;
    employee_code?: string;
    avatar_url?: string;
  } | null;
  pendingCount?: number;
  onClick?: () => void;
  showAvatar?: boolean;
  showPendingBadge?: boolean;
  notificationBadge?: {
    text: string;
    color?: string;
    variant?: 'light' | 'filled' | 'outline' | 'dot' | 'gradient';
    tooltip?: string;
  };
}

export function EmployeeColumn({
  employee,
  pendingCount = 0,
  onClick,
  showAvatar = true,
  showPendingBadge = true,
  notificationBadge,
}: EmployeeColumnProps) {
  const fullName = employee?.full_name ?? employee?.employee_id ?? 'Unknown';
  const code = employee?.employee_code ?? '';
  const avatarUrl = employee?.avatar_url;

  // Generate initials
  const words = fullName.trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? `${words[words.length - 1][0]}${words[0][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

  const nameElement = onClick ? (
    <Anchor size="sm" fw={500} style={{ cursor: 'pointer', lineHeight: 1.3 }} onClick={onClick}>
      {fullName}
    </Anchor>
  ) : (
    <Text size="sm" fw={500}>
      {fullName}
    </Text>
  );

  return (
    <Group gap={8} wrap="nowrap">
      {showAvatar && (
        <Avatar src={avatarUrl} size={32} radius="xl" color="deepPurple" variant="light">
          {!avatarUrl && (
            <Text size="10px" fw={700}>
              {initials}
            </Text>
          )}
        </Avatar>
      )}
      <Stack gap={0}>
        <Group gap={6} wrap="nowrap">
          {nameElement}
          {showPendingBadge && pendingCount > 0 && (
            <Tooltip
              label={`${pendingCount} leave request${pendingCount > 1 ? 's' : ''} pending admin review`}
              withArrow
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: 'var(--mantine-color-orange-1)',
                  border: '1px solid var(--mantine-color-orange-3)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--mantine-color-orange-7)',
                  lineHeight: 1.4,
                  cursor: 'default',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--mantine-color-orange-5)',
                    display: 'inline-block',
                  }}
                />
                {pendingCount} pending
              </span>
            </Tooltip>
          )}
          {notificationBadge && (
            <Tooltip
              label={notificationBadge.tooltip}
              withArrow
              disabled={!notificationBadge.tooltip}
            >
              <Badge
                size="sm"
                variant={notificationBadge.variant || 'light'}
                color={notificationBadge.color || 'blue'}
                style={{ cursor: 'default' }}
              >
                {notificationBadge.text}
              </Badge>
            </Tooltip>
          )}
        </Group>
        {code && (
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
            {code}
          </Text>
        )}
      </Stack>
    </Group>
  );
}
