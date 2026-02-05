import {
  Group,
  NavLink,
  Stack,
  ThemeIcon,
  Text,
  Avatar,
} from '@mantine/core';
import { IconChevronRight, IconHierarchy } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MENUS } from './Menu';
import classes from './Navbar.module.css';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Stack gap={4} p={10} className={classes.navbar}>
      <div className={classes.header}>
        <Group gap="sm">
          <ThemeIcon
            size={36}
            radius="md"
            variant="light"
            color="blue"
          >
            <IconHierarchy  size={20} />
          </ThemeIcon>

          <Text fw={700} size="lg">
            RMS Core
          </Text>
        </Group>
      </div>
    
      <div className={classes.navMain}>  
        {MENUS.map((menu) => {
          const hasChildren = !!menu.children?.length;

          const childActive = menu.children?.some(
            (c) => c.path === location.pathname
          );

          const isActive =
            location.pathname === menu.path || childActive;

          const [opened, setOpened] = useState(childActive);

          return (
            <NavLink
              key={menu.label}
              label={menu.label}
              active={isActive}
              opened={opened}
              leftSection={
                menu.icon && (
                  <ThemeIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    radius="sm"
                  >
                    <menu.icon size={16} />
                  </ThemeIcon>
                )
              }
              rightSection={
                hasChildren && (
                  <IconChevronRight
                    size={16}
                    className={classes.chevron}
                    data-opened={opened || undefined}
                  />
                )
              }
              classNames={{
                root: classes.root,
                label: classes.label,
                children: classes.children,
              }}
              onClick={() => {
                if (hasChildren) {
                  setOpened((o) => !o);
                } else if (menu.path) {
                  navigate(menu.path);
                }
              }}
            >
              {menu.children?.map((child) => (
                <NavLink
                  key={child.path}
                  label={child.label}
                  active={location.pathname === child.path}
                  onClick={() => navigate(child.path!)}
                />
              ))}
            </NavLink>
          );
        })}        
      </div>

      <div className={classes.footer}>
        <Group wrap='nowrap'>
          <Avatar
            src="/avatar.jpg"
            radius="xl"
            size={40}
          />

          <div>
            <Text size="sm" fw={600}>
              Bui Dieu Linh
            </Text>
            <Text size="xs" c="dimmed">
              linh.bui@outlook.com
            </Text>
          </div>
        </Group>
      </div>
    </Stack>
  );
}
