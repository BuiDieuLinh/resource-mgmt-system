import { Group, Text, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconHome } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENUS } from './Menu';

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

export function AppBreadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = findPath(MENUS, location.pathname);
  const all: BreadcrumbItem[] = [{ label: 'Home', path: '/' }, ...items];

  return (
    <Group gap={4} align="center" wrap="nowrap">
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        const isHome = i === 0;
        return (
          <Group key={i} gap={4} align="center" wrap="nowrap">
            {isHome ? (
              <UnstyledButton
                onClick={() => navigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--mantine-color-dimmed)',
                }}
              >
                <IconHome size={16} />
              </UnstyledButton>
            ) : isLast ? (
              <Text size="sm" fw={600} c="dark">
                {item.label}
              </Text>
            ) : (
              <UnstyledButton onClick={() => item.path && navigate(item.path)}>
                <Text
                  size="sm"
                  c="dimmed"
                  style={{ ':hover': { color: 'var(--mantine-color-text)' } }}
                >
                  {item.label}
                </Text>
              </UnstyledButton>
            )}
            {!isLast && (
              <IconChevronRight
                size={12}
                color="var(--mantine-color-dimmed)"
                style={{ flexShrink: 0 }}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
