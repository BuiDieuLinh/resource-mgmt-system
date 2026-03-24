import { Stack, Text, Group, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconHome } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENUS } from '../../modules/app/Menu';

type BreadcrumbItem = { label: string; path?: string };

function findPath(menus: any[], pathname: string): BreadcrumbItem[] {
  const result: BreadcrumbItem[] = [];
  function dfs(items: any[], parents: any[]): boolean {
    for (const m of items) {
      const current = [...parents, m];
      if (m.path === pathname) {
        current.forEach((i) => result.push({ label: i.label, path: i.path }));
        return true;
      }
      if (m.children && dfs(m.children, current)) return true;
    }
    return false;
  }
  dfs(menus, []);
  return result;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = findPath(MENUS, location.pathname);
  const all: BreadcrumbItem[] = [{ label: 'Home', path: '/' }, ...items];

  return (
    <Stack gap={4} mb="lg">
      <Group gap={4} align="center">
        {all.map((item, i) => {
          const isLast = i === all.length - 1;
          return (
            <Group key={i} gap={4} align="center" wrap="nowrap">
              {i === 0 ? (
                <UnstyledButton
                  onClick={() => navigate('/')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--mantine-color-dimmed)',
                  }}
                >
                  <IconHome size={13} />
                </UnstyledButton>
              ) : isLast ? (
                <Text size="xs" fw={600} c="dark.4">
                  {item.label}
                </Text>
              ) : (
                <UnstyledButton onClick={() => item.path && navigate(item.path)}>
                  <Text size="xs" c="dimmed">
                    {item.label}
                  </Text>
                </UnstyledButton>
              )}
              {!isLast && <IconChevronRight size={11} color="var(--mantine-color-dimmed)" />}
            </Group>
          );
        })}
      </Group>

      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Text size="xl" fw={700} lh={1.2}>
            {title}
          </Text>
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
        {right && <div>{right}</div>}
      </Group>
    </Stack>
  );
}
