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
  IconHome,
  IconLanguage,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MENUS } from './Menu';
import classes from './Navbar.module.css';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { myProfileUrl, settingsUrl } from '@/routes/url';
import { useGetNotifications, useMarkRead, useMarkAllRead } from '@/modules/notifications/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { EMPLOYEE_ROLE } from '@/constant';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
dayjs.extend(relativeTime);

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Navbar({ collapsed, onToggle }: NavbarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, logout } = useAuth();
  const isSettingDisabled =
    !user?.roles.includes(EMPLOYEE_ROLE.ADMIN) && !user?.roles.includes(EMPLOYEE_ROLE.HR);

  const { data: notiData } = useGetNotifications();
  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const notifications = notiData?.notifications ?? [];
  const unread = notiData?.unread_count ?? 0;
  const currentLanguage = i18n.language?.startsWith('en') ? 'en' : 'vi';
  dayjs.locale(currentLanguage);

  const userRoles = user?.roles ?? [];
  const canSee = (roles?: string[]) => !roles?.length || roles.some((r) => userRoles.includes(r));
  const visibleMenus = MENUS.filter((m) => canSee(m.roles))
    .map((m) => ({
      ...m,
      children: m.children?.filter((c) => canSee(c.roles)),
    }))
    .filter((m) => m.path || (m.children && m.children.length > 0));

  const resolveNotificationLink = (link?: string | null) => {
    if (!link) return null;
    return link.startsWith('/') ? link : `/${link}`;
  };

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
            <Tooltip label={t('nav.expand')} position="right" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onToggle}>
                <IconLayoutSidebarLeftExpand size={18} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Group gap="sm" justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon size={34} radius="md" color="deepPurple" variant="filled">
                  <IconHierarchy size={20} />
                </ThemeIcon>
                <Text fw={700} size="md" style={{ letterSpacing: '-0.3px' }}>
                  {t('nav.brand')}
                </Text>
              </Group>
              <Tooltip label={t('nav.collapse')} position="right" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={onToggle}>
                  <IconLayoutSidebarLeftCollapse size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>
      </div>

      <div className={classes.navMain}>
        {visibleMenus.map((menu) => {
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
                    <Menu.Label>{menu.labelKey ? t(menu.labelKey) : menu.label}</Menu.Label>
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
                        {child.labelKey ? t(child.labelKey) : child.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              );
            }

            return (
              <Tooltip
                key={menu.label}
                label={menu.labelKey ? t(menu.labelKey) : menu.label}
                position="right"
                withArrow
              >
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
              label={menu.labelKey ? t(menu.labelKey) : menu.label}
              onClick={() => {
                if (hasChildren) setOpened((o) => !o);
                else if (menu.path) navigate(menu.path);
              }}
            >
              {menu.children?.map((child) => (
                <NavLink
                  key={child.path}
                  label={child.labelKey ? t(child.labelKey) : child.label}
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
          collapsed ? (
            <Indicator
              inline
              label={currentLanguage.toUpperCase()}
              size={16}
              offset={1}
              color="gray"
              classNames={{ indicator: classes.languageBadge }}
            >
              <IconLanguage size={18} color="var(--mantine-color-dimmed)" />
            </Indicator>
          ) : (
            <IconLanguage size={18} color="var(--mantine-color-dimmed)" />
          ),
          collapsed
            ? `${t('common.language')}: ${currentLanguage.toUpperCase()}`
            : t('common.language'),
          collapsed ? undefined : (
            <SegmentedControl
              size="xs"
              radius="xl"
              value={currentLanguage}
              onChange={(value) => i18n.changeLanguage(value)}
              data={[
                { label: 'VI', value: 'vi' },
                { label: 'EN', value: 'en' },
              ]}
              classNames={{
                root: classes.languageSwitch,
                indicator: classes.languageIndicator,
                label: classes.languageSwitchLabel,
              }}
            />
          ),
          collapsed ? () => i18n.changeLanguage(currentLanguage === 'vi' ? 'en' : 'vi') : undefined,
        )}

        {footerRow(
          colorScheme === 'dark' ? (
            <IconSun size={18} color="var(--mantine-color-dimmed)" />
          ) : (
            <IconMoon size={18} color="var(--mantine-color-dimmed)" />
          ),
          colorScheme === 'dark' ? t('common.lightMode') : t('common.darkMode'),
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => toggleColorScheme()}>
            {colorScheme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </ActionIcon>,
          () => toggleColorScheme(),
        )}

        <Menu shadow="md" width={320} position="right-end" offset={12}>
          <Menu.Target>
            <div>
              {footerRow(
                <Indicator label={unread} size={15} disabled={unread === 0} color="red" offset={2}>
                  <IconBell size={18} color="var(--mantine-color-dimmed)" />
                </Indicator>,
                t('common.notifications'),
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
                {t('common.notifications')}
              </Text>
              {unread > 0 && (
                <UnstyledButton onClick={() => markAllReadMutation.mutate()}>
                  <Text size="xs" c="deepPurple" fw={500}>
                    {t('common.markAllRead')}
                  </Text>
                </UnstyledButton>
              )}
            </Group>
            <Divider />
            <ScrollArea.Autosize mah={320}>
              <Stack gap={0}>
                {notifications.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center" py="md" px="sm">
                    {t('common.noNotificationsYet')}
                  </Text>
                ) : (
                  notifications.map((n) => (
                    <UnstyledButton
                      key={n.id}
                      px="sm"
                      py={10}
                      style={{
                        background: n.is_read ? 'transparent' : 'var(--mantine-color-deepPurple-0)',
                        borderBottom: '1px solid var(--mantine-color-default-border)',
                        width: '100%',
                      }}
                      onClick={() => {
                        if (!n.is_read) markReadMutation.mutate(n.id);
                        const target = resolveNotificationLink(n.link);
                        if (target) navigate(target);
                      }}
                    >
                      <Group gap="sm" wrap="nowrap" align="flex-start" w={280}>
                        <Indicator color="deepPurple" size={7} disabled={n.is_read} mt={6}>
                          <Avatar size={28} radius="xl" color="deepPurple" variant="light">
                            <IconBell size={15} />
                          </Avatar>
                        </Indicator>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="xs" fw={600} truncate>
                            {n.title}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {n.body}
                          </Text>
                          <Tooltip
                            label={dayjs(n.created_at).format('YYYY-MM-DD HH:mm:ss')}
                            withArrow
                          >
                            <Text size="xs" c="dimmed" mt={2} w={'fit-content'}>
                              {dayjs(n.created_at).fromNow()}
                            </Text>
                          </Tooltip>
                        </Box>
                      </Group>
                    </UnstyledButton>
                  ))
                )}
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
                  <IconUser size={14} />
                </Avatar>,
                user?.email ?? '',
                <IconChevronDown size={14} color="var(--mantine-color-dimmed)" />,
              )}
            </div>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{user?.email ?? ''}</Menu.Label>
            <Menu.Item
              leftSection={<IconUser style={{ width: rem(14) }} />}
              onClick={() => navigate(myProfileUrl)}
            >
              {t('nav.myProfile')}
            </Menu.Item>
            {!isSettingDisabled && (
              <Menu.Item
                leftSection={<IconSettings style={{ width: rem(14) }} />}
                onClick={() => navigate(settingsUrl)}
              >
                {t('nav.settings')}
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconHome style={{ width: rem(14) }} />}
              onClick={() => navigate('/')}
            >
              {t('nav.backToHome')}
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconLogout style={{ width: rem(14) }} />}
              onClick={logout}
            >
              {t('nav.signOut')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}
