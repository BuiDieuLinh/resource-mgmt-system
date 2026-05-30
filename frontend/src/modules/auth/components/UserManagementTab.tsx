import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  Modal,
  MultiSelect,
  Pagination,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconKey, IconPencil, IconSearch, IconShield, IconUsers } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionLabel } from '@/components/SettingsUI';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { authApi, type UserItem } from '../api/auth.api';
import classes from './UserManagement.module.css';

const PAGE_SIZE = 10;

function getRoleColor(role: string) {
  if (role === 'admin') return 'red';
  if (role === 'hr') return 'grape';
  if (role === 'manager') return 'blue';
  return 'gray';
}

function getStatusColor(status: string) {
  return status === 'active' ? 'green' : 'gray';
}

function UserAvatar({ email, size = 28 }: { email: string; size?: number }) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <Avatar size={size} radius="xl" color="deepPurple" variant="light">
      <Text size={`${Math.max(10, Math.round(size * 0.35))}px`} fw={700}>
        {initials}
      </Text>
    </Avatar>
  );
}

export function UserManagementTab() {
  const { i18n } = useTranslation();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserItem | null>(null);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<'active' | 'inactive'>('inactive');
  const [statusTarget, setStatusTarget] = useState<UserItem | null>(null);

  const locale = i18n.language?.startsWith('vi') ? 'vi' : 'en';
  const editForm = useForm({ initialValues: { roles: [] as string[] } });

  const getRoleLabelText = (role: string) => {
    if (role === 'admin') return locale === 'vi' ? 'Quản trị viên' : 'Admin';
    if (role === 'hr') return locale === 'vi' ? 'Nhân sự' : 'HR';
    if (role === 'manager') return locale === 'vi' ? 'Quản lý' : 'Manager';
    if (role === 'employee') return locale === 'vi' ? 'Nhân viên' : 'Employee';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getStatusLabelText = (status: string) => {
    if (status === 'active') return locale === 'vi' ? 'Đang hoạt động' : 'Active';
    if (status === 'inactive') return locale === 'vi' ? 'Ngưng hoạt động' : 'Inactive';
    return status;
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([authApi.listUsers(), authApi.listRoles()])
      .then(([u, r]) => {
        setUsers(u.data.data);
        setAllRoles(r.data.data.map((x) => x.name));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = paginated.length > 0 && paginated.every((u) => selected.includes(u.id));

  const confirmEditRoles = async () => {
    if (!editUser) return;
    setSubmitting(true);
    try {
      await authApi.updateRoles(editUser.id, editForm.values.roles);
      notifications.show({
        color: 'green',
        message: locale === 'vi' ? 'Cập nhật vai trò thành công' : 'Roles updated successfully',
      });
      setEditUser(null);
      fetchAll();
    } catch {
      notifications.show({
        color: 'red',
        message: locale === 'vi' ? 'Không thể cập nhật vai trò' : 'Failed to update roles',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    const next = statusTarget.status === 'active' ? 'inactive' : 'active';
    try {
      await authApi.updateStatus(statusTarget.id, next);
      setUsers((prev) => prev.map((u) => (u.id === statusTarget.id ? { ...u, status: next } : u)));
      notifications.show({
        color: 'green',
        message:
          next === 'active'
            ? locale === 'vi'
              ? 'Đã kích hoạt người dùng'
              : 'User activated'
            : locale === 'vi'
              ? 'Đã vô hiệu hóa người dùng'
              : 'User deactivated',
      });
    } catch {
      notifications.show({
        color: 'red',
        message: locale === 'vi' ? 'Không thể cập nhật trạng thái' : 'Failed to update status',
      });
    } finally {
      setStatusTarget(null);
    }
  };

  const confirmResetPassword = async () => {
    if (!resetTarget) return;
    try {
      await authApi.resetPassword(resetTarget.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === resetTarget.id ? { ...u, is_first_login: true } : u)),
      );
      notifications.show({
        color: 'green',
        message: locale === 'vi' ? 'Đã đặt lại mật khẩu mặc định' : 'Password reset to default',
      });
    } catch {
      notifications.show({
        color: 'red',
        message: locale === 'vi' ? 'Không thể đặt lại mật khẩu' : 'Failed to reset password',
      });
    } finally {
      setResetTarget(null);
    }
  };

  const confirmBulkStatus = async () => {
    try {
      await Promise.all(selected.map((id) => authApi.updateStatus(id, bulkTargetStatus)));
      setUsers((prev) =>
        prev.map((u) => (selected.includes(u.id) ? { ...u, status: bulkTargetStatus } : u)),
      );
      setSelected([]);
      notifications.show({
        color: 'green',
        message:
          locale === 'vi'
            ? `Đã cập nhật ${selected.length} người dùng`
            : `${selected.length} users updated`,
      });
    } catch {
      notifications.show({
        color: 'red',
        message: locale === 'vi' ? 'Không thể cập nhật người dùng' : 'Failed to update users',
      });
    } finally {
      setBulkStatusOpen(false);
    }
  };

  return (
    <Stack gap="sm">
      <SectionLabel>{locale === 'vi' ? 'Tài khoản người dùng' : 'User Accounts'}</SectionLabel>

      <Card withBorder radius="md" p={0} className={classes.root}>
        <div className={classes.toolbar}>
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text fw={600}>{locale === 'vi' ? 'Quản lý tài khoản' : 'Account management'}</Text>
              <Text size="sm" c="dimmed">
                {locale === 'vi'
                  ? 'Tìm kiếm, cập nhật vai trò, trạng thái và đặt lại mật khẩu.'
                  : 'Search, update roles, status, and reset passwords.'}
              </Text>
            </Stack>
            <TextInput
              placeholder={locale === 'vi' ? 'Tìm người dùng...' : 'Search users...'}
              leftSection={<IconSearch size={14} color="#9ca3af" />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              className={classes.searchInput}
              size="sm"
            />
          </Group>
          {selected.length > 0 && (
            <Group gap={8} mt="sm">
              <Badge variant="light" color="violet" size="md">
                {locale === 'vi' ? `Đã chọn ${selected.length}` : `${selected.length} selected`}
              </Badge>
              <Button
                size="xs"
                color="green"
                variant="light"
                onClick={() => {
                  setBulkTargetStatus('active');
                  setBulkStatusOpen(true);
                }}
              >
                {locale === 'vi' ? 'Đặt hoạt động' : 'Set active'}
              </Button>
              <Button
                size="xs"
                color="red"
                variant="light"
                onClick={() => {
                  setBulkTargetStatus('inactive');
                  setBulkStatusOpen(true);
                }}
              >
                {locale === 'vi' ? 'Đặt ngưng hoạt động' : 'Set inactive'}
              </Button>
            </Group>
          )}
        </div>

        <div className={classes.tableWrap}>
          <Table highlightOnHover verticalSpacing="md" className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={44}>
                  <Checkbox
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : paginated.map((u) => u.id))}
                    size="sm"
                  />
                </Table.Th>
                <Table.Th>{locale === 'vi' ? 'Người dùng' : 'User'}</Table.Th>
                <Table.Th>{locale === 'vi' ? 'Vai trò' : 'Roles'}</Table.Th>
                <Table.Th>{locale === 'vi' ? 'Trạng thái' : 'Status'}</Table.Th>
                <Table.Th>{locale === 'vi' ? 'Đăng nhập đầu' : 'First login'}</Table.Th>
                <Table.Th>{locale === 'vi' ? 'Ngày tạo' : 'Created'}</Table.Th>
                <Table.Th w={90} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton height={16} width={16} radius="sm" />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={10}>
                        <Skeleton height={36} width={36} radius="xl" />
                        <Stack gap={6}>
                          <Skeleton height={12} width={180} radius="sm" />
                          <Skeleton height={10} width={100} radius="sm" />
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={20} width={80} radius="xl" />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={20} width={70} radius="xl" />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={20} width={80} radius="xl" />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={12} width={90} radius="sm" />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Skeleton height={26} width={26} radius="sm" />
                        <Skeleton height={26} width={26} radius="sm" />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : filtered.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} ta="center" py={64}>
                    <Stack align="center" gap={6}>
                      <IconUsers size={32} color="#e5e7eb" />
                      <Text size="sm" c="#9ca3af">
                        {locale === 'vi' ? 'Không tìm thấy người dùng' : 'No users found'}
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginated.map((u) => (
                  <Table.Tr
                    key={u.id}
                    className={`${classes.row} ${selected.includes(u.id) ? classes.selectedRow : ''}`}
                  >
                    <Table.Td>
                      <Checkbox
                        size="sm"
                        checked={selected.includes(u.id)}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id],
                          )
                        }
                      />
                    </Table.Td>

                    <Table.Td>
                      <Group gap={10}>
                        <UserAvatar email={u.email} />
                        <Stack gap={1}>
                          <Text size="sm" fw={500}>
                            {u.email}
                          </Text>
                        </Stack>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4}>
                        {u.roles.length === 0 ? (
                          <Text size="xs" c="#d1d5db">
                            —
                          </Text>
                        ) : (
                          u.roles.map((r) => (
                            <Badge
                              key={r}
                              size="xs"
                              variant="light"
                              color={getRoleColor(r)}
                              leftSection={r === 'admin' ? <IconShield size={8} /> : undefined}
                            >
                              {getRoleLabelText(r)}
                            </Badge>
                          ))
                        )}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Switch
                        size="xs"
                        checked={u.status === 'active'}
                        color={getStatusColor(u.status)}
                        onChange={() => setStatusTarget(u)}
                        label={
                          <Text
                            size="xs"
                            fw={500}
                            c={u.status === 'active' ? '#16a34a' : '#9ca3af'}
                          >
                            {getStatusLabelText(u.status)}
                          </Text>
                        }
                      />
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        size="sm"
                        variant="light"
                        color={u.is_first_login ? 'orange' : 'green'}
                      >
                        {u.is_first_login
                          ? locale === 'vi'
                            ? 'Có'
                            : 'True'
                          : locale === 'vi'
                            ? 'Không'
                            : 'False'}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Text size="xs" c="#9ca3af">
                        {new Date(u.createdAt).toLocaleDateString(
                          locale === 'vi' ? 'vi-VN' : 'en-GB',
                          { day: '2-digit', month: 'short', year: 'numeric' },
                        )}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip
                          label={locale === 'vi' ? 'Sửa vai trò' : 'Edit roles'}
                          withArrow
                          fz="xs"
                        >
                          <ActionIcon
                            variant="subtle"
                            color="violet"
                            size="sm"
                            onClick={() => {
                              setEditUser(u);
                              editForm.setValues({ roles: u.roles });
                            }}
                          >
                            <IconPencil size={13} />
                          </ActionIcon>
                        </Tooltip>
                        {!u.is_first_login && (
                          <Tooltip
                            label={locale === 'vi' ? 'Đặt lại mật khẩu' : 'Reset password'}
                            withArrow
                            fz="xs"
                          >
                            <ActionIcon
                              variant="subtle"
                              color="orange"
                              size="sm"
                              onClick={() => setResetTarget(u)}
                            >
                              <IconKey size={13} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>

        {!loading && totalPages > 1 && (
          <Group justify="space-between" px={20} py={16} className={classes.paginationBar}>
            <Text size="sm" c="#9ca3af">
              {locale === 'vi'
                ? `Hiển thị ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)} trong ${filtered.length} người dùng`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} users`}
            </Text>
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              radius="md"
              styles={{
                control: { border: '1px solid #ede9f6' },
              }}
            />
          </Group>
        )}
      </Card>

      <Modal
        opened={!!editUser}
        onClose={() => setEditUser(null)}
        centered
        radius="lg"
        size="sm"
        title={
          <Group gap={8}>
            <Box className={classes.modalIcon} style={{ background: '#f3f0fa' }}>
              <IconShield size={15} color="#7c3aed" />
            </Box>
            <Text fw={700} size="sm">
              {locale === 'vi' ? 'Sửa vai trò' : 'Edit roles'}
            </Text>
          </Group>
        }
      >
        {editUser && (
          <Stack gap="lg">
            <Group
              gap={10}
              p={12}
              style={{
                background: '#faf8fd',
                borderRadius: 10,
                border: '1px solid #ede9f6',
              }}
            >
              <UserAvatar email={editUser.email} size={40} />
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {editUser.email}
                </Text>
                <Text size="xs" c="#9ca3af">
                  {locale === 'vi' ? 'Hiện tại' : 'Current'}:{' '}
                  {editUser.roles.map(getRoleLabelText).join(', ') || '—'}
                </Text>
              </Stack>
            </Group>
            <MultiSelect
              label={locale === 'vi' ? 'Gán vai trò' : 'Assign roles'}
              data={allRoles.map((r) => ({ value: r, label: getRoleLabelText(r) }))}
              value={editForm.values.roles}
              onChange={(v) => editForm.setFieldValue('roles', v)}
              placeholder={locale === 'vi' ? 'Chọn vai trò...' : 'Select roles...'}
              size="sm"
            />
            <Divider />
            <Group gap={8} justify="flex-end">
              <Button variant="subtle" color="gray" size="sm" onClick={() => setEditUser(null)}>
                {locale === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                loading={submitting}
                className={classes.primaryBtn}
                onClick={confirmEditRoles}
              >
                {locale === 'vi' ? 'Lưu thay đổi' : 'Save changes'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <ConfirmModal
        opened={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmToggleStatus}
        title={
          statusTarget?.status === 'active'
            ? locale === 'vi'
              ? 'Vô hiệu hóa người dùng?'
              : 'Deactivate user?'
            : locale === 'vi'
              ? 'Kích hoạt người dùng?'
              : 'Activate user?'
        }
        message={
          statusTarget?.status === 'active'
            ? locale === 'vi'
              ? 'Người dùng này sẽ không thể đăng nhập nữa.'
              : 'This user will no longer be able to sign in.'
            : locale === 'vi'
              ? 'Người dùng này sẽ có thể đăng nhập lại.'
              : 'This user will be able to sign in again.'
        }
        confirmLabel={
          statusTarget?.status === 'active'
            ? locale === 'vi'
              ? 'Vô hiệu hóa'
              : 'Deactivate'
            : locale === 'vi'
              ? 'Kích hoạt'
              : 'Activate'
        }
        type={statusTarget?.status === 'active' ? 'danger' : 'info'}
      />

      <ConfirmModal
        opened={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={confirmResetPassword}
        title={locale === 'vi' ? 'Đặt lại mật khẩu?' : 'Reset password?'}
        message={
          locale === 'vi'
            ? 'Mật khẩu sẽ được đặt về mặc định của hệ thống. Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.'
            : 'Password will be reset to the system default. The user will be prompted to change it on next login.'
        }
        confirmLabel={locale === 'vi' ? 'Đặt lại mật khẩu' : 'Reset password'}
        type="warning"
      />

      <ConfirmModal
        opened={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        onConfirm={confirmBulkStatus}
        title={
          locale === 'vi'
            ? `Cập nhật ${selected.length} người dùng?`
            : `Update ${selected.length} users?`
        }
        message={
          bulkTargetStatus === 'inactive'
            ? locale === 'vi'
              ? 'Các người dùng này sẽ không thể đăng nhập nữa.'
              : 'These users will no longer be able to sign in.'
            : locale === 'vi'
              ? 'Các người dùng này sẽ có thể đăng nhập lại.'
              : 'These users will be able to sign in again.'
        }
        confirmLabel={locale === 'vi' ? 'Xác nhận' : 'Confirm'}
        type={bulkTargetStatus === 'inactive' ? 'danger' : 'info'}
      />
    </Stack>
  );
}
