import {
  Group,
  NavLink,
  ThemeIcon,
  Text,
  UnstyledButton,
  Box,
  Tooltip,
  ActionIcon,
  Avatar,
  Menu,
  Divider,
  rem,
  Indicator,
  ScrollArea,
  Stack,
  useMantineColorScheme,
  SegmentedControl,
} from '@mantine/core';
import {
  IconChevronRight,
  IconHierarchy,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSun,
  IconMoon,
  IconBell,
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconLanguage,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MENUS } from './Menu';
import classes from './Navbar.module.css';

const MOCK_NOTIS = [
  {
    id: '1',
    title: 'New leave request',
    desc: 'Nguyen Van A submitted a leave request',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    title: 'Attendance approved',
    desc: 'Your timesheet for March has been approved',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    title: 'Policy updated',
    desc: 'Work policy effective from April 1st',
    time: '3h ago',
    read: true,
  },
];

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Navbar({ collapsed, onToggle }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [lang, setLang] = useState('vi');
  const [notis, setNotis] = useState(MOCK_NOTIS);
  const unread = notis.filter((n) => !n.read).length;

  const footerRow = (
    icon: React.ReactNode,
    label: string,
    right?: React.ReactNode,
    onClick?: () => void,
  ) => (
    <Box
      className={classes.footerRow}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Group gap="sm" wrap="nowrap" justify={collapsed ? 'center' : 'space-between'}>
        {collapsed ? (
          <Tooltip label={label} position="right" withArrow>
            {icon as any}
          </Tooltip>
        ) : (
          <>
            <Group gap="sm" wrap="nowrap">
              {icon}
              <Text size="sm" c="dimmed">
                {label}
              </Text>
            </Group>
            {right}
          </>
        )}
      </Group>
    </Box>
  );

  return (
    <div className={classes.navbar}>
      <div className={classes.logo}>
        <Group gap="sm" justify={collapsed ? 'center' : 'space-between'} wrap="nowrap">
          {' '}
          {collapsed ? (
            <Tooltip label="Expand" position="right" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onToggle}>
                <IconLayoutSidebarLeftExpand size={16} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Group gap="sm" justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon size={34} radius="md" color="deepPurple" variant="filled">
                  <IconHierarchy size={18} />
                </ThemeIcon>
                <Text fw={700} size="md" style={{ letterSpacing: '-0.3px' }}>
                  RMS Core
                </Text>
              </Group>
              <Tooltip label="Collapse" position="right" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={onToggle}>
                  <IconLayoutSidebarLeftCollapse size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>
      </div>

      <div className={classes.navMain}>
        {MENUS.map((menu) => {
          const hasChildren = !!menu.children?.length;
          const childActive = menu.children?.some((c) => c.path === location.pathname);
          const isActive = location.pathname === menu.path || childActive;
          const [opened, setOpened] = useState(!!childActive);

          if (collapsed) {
            if (hasChildren) {
              return (
                <Menu key={menu.label} shadow="md" position="right-start" offset={8} withArrow>
                  <Menu.Target>
                    <UnstyledButton
                      className={classes.collapsedItem}
                      data-active={isActive || undefined}
                    >
                      {menu.icon && (
                        <ThemeIcon
                          variant={isActive ? 'filled' : 'light'}
                          color="deepPurple"
                          size={30}
                          radius="sm"
                        >
                          <menu.icon size={15} />
                        </ThemeIcon>
                      )}
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>{menu.label}</Menu.Label>
                    {menu.children?.map((child) => (
                      <Menu.Item
                        key={child.path}
                        leftSection={child.icon ? <child.icon size={14} /> : undefined}
                        onClick={() => navigate(child.path!)}
                        style={{
                          fontWeight: location.pathname === child.path ? 600 : undefined,
                          color:
                            location.pathname === child.path
                              ? 'var(--mantine-color-deepPurple-6)'
                              : undefined,
                        }}
                      >
                        {child.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              );
            }

            return (
              <Tooltip key={menu.label} label={menu.label} position="right" withArrow>
                <UnstyledButton
                  className={classes.collapsedItem}
                  data-active={isActive || undefined}
                  onClick={() => {
                    if (menu.path) navigate(menu.path);
                  }}
                >
                  {menu.icon && (
                    <ThemeIcon
                      variant={isActive ? 'filled' : 'light'}
                      color="deepPurple"
                      size={30}
                      radius="sm"
                    >
                      <menu.icon size={15} />
                    </ThemeIcon>
                  )}
                </UnstyledButton>
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={menu.label}
              label={menu.label}
              active={isActive}
              opened={opened}
              leftSection={
                menu.icon && (
                  <ThemeIcon
                    variant={isActive ? 'filled' : 'light'}
                    color="deepPurple"
                    size={26}
                    radius="sm"
                  >
                    <menu.icon size={14} />
                  </ThemeIcon>
                )
              }
              rightSection={
                hasChildren && (
                  <IconChevronRight
                    size={14}
                    className={classes.chevron}
                    data-opened={opened || undefined}
                  />
                )
              }
              classNames={{ root: classes.root, label: classes.label, children: classes.children }}
              onClick={() => {
                if (hasChildren) setOpened((o) => !o);
                else if (menu.path) navigate(menu.path);
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
        {footerRow(
          <IconLanguage size={16} color="var(--mantine-color-dimmed)" />,
          'Language',
          <SegmentedControl
            size="xs"
            value={lang}
            onChange={setLang}
            data={[
              { label: 'VI', value: 'vi' },
              { label: 'EN', value: 'en' },
            ]}
            styles={{
              root: {
                background: 'transparent',
                border: '1px solid var(--mantine-color-default-border)',
                padding: 2,
              },
              label: { paddingInline: 7, paddingBlock: 1, fontSize: 10, fontWeight: 700 },
            }}
          />,
        )}

        {footerRow(
          colorScheme === 'dark' ? (
            <IconSun size={16} color="var(--mantine-color-dimmed)" />
          ) : (
            <IconMoon size={16} color="var(--mantine-color-dimmed)" />
          ),
          colorScheme === 'dark' ? 'Light mode' : 'Dark mode',
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => toggleColorScheme()}>
            {colorScheme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
          </ActionIcon>,
          () => toggleColorScheme(),
        )}

        <Menu shadow="md" width={320} position="right-end" offset={12}>
          <Menu.Target>
            <div>
              {footerRow(
                <Indicator label={unread} size={15} disabled={unread === 0} color="red" offset={2}>
                  <IconBell size={16} color="var(--mantine-color-dimmed)" />
                </Indicator>,
                'Notifications',
                unread > 0 ? (
                  <ThemeIcon
                    size={18}
                    radius="xl"
                    color="red"
                    variant="filled"
                    style={{ fontSize: 10 }}
                  >
                    {unread}
                  </ThemeIcon>
                ) : undefined,
              )}
            </div>
          </Menu.Target>
          <Menu.Dropdown>
            <Group justify="space-between" px="sm" py={8}>
              <Text size="sm" fw={600}>
                Notifications
              </Text>
              {unread > 0 && (
                <UnstyledButton
                  onClick={() => setNotis((p) => p.map((n) => ({ ...n, read: true })))}
                >
                  <Text size="xs" c="deepPurple" fw={500}>
                    Mark all read
                  </Text>
                </UnstyledButton>
              )}
            </Group>
            <Divider />
            <ScrollArea.Autosize mah={320}>
              <Stack gap={0}>
                {notis.map((n) => (
                  <UnstyledButton
                    key={n.id}
                    px="sm"
                    py={10}
                    style={{
                      background: n.read ? 'transparent' : 'var(--mantine-color-deepPurple-0)',
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                      width: '100%',
                    }}
                    onClick={() =>
                      setNotis((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                    }
                  >
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <Indicator color="deepPurple" size={7} disabled={n.read} mt={6}>
                        <Avatar size={28} radius="xl" color="deepPurple" variant="light">
                          <IconBell size={13} />
                        </Avatar>
                      </Indicator>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="xs" fw={600} truncate>
                          {n.title}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {n.desc}
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          {n.time}
                        </Text>
                      </Box>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Menu.Dropdown>
        </Menu>

        <Divider mb={6} />

        <Menu shadow="md" width={200} position="right-end" offset={12} withArrow>
          <Menu.Target>
            <div>
              {footerRow(
                <Avatar size={22} radius="xl" color="deepPurple" src={null}>
                  <IconUser size={12} />
                </Avatar>,
                'Bui Dieu Linh',
                <IconChevronDown size={12} color="var(--mantine-color-dimmed)" />,
              )}
            </div>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>linh.bui@outlook.com</Menu.Label>
            <Menu.Item leftSection={<IconUser style={{ width: rem(14) }} />}>My Profile</Menu.Item>
            <Menu.Item leftSection={<IconSettings style={{ width: rem(14) }} />}>
              Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconLogout style={{ width: rem(14) }} />}>
              Sign out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}
