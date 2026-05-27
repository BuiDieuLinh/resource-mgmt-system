import {
  Modal,
  Group,
  ThemeIcon,
  Text,
  Badge,
  Stack,
  Box,
  Divider,
  ActionIcon,
  Tooltip,
  Button,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconBriefcase, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { IDepartment, IDepartmentPosition } from '../types';
import { LEVEL_LABEL, LEVEL_COLOR, type LevelPosition } from '@/constant';
import { PositionFormModal } from '@/modules/positions/components/PositionFormModal';
import { mapPositionToFormValues } from '@/modules/positions/utils/position-mapper';
import { useCreatePosition } from '@/modules/positions/api/create-position';
import { useUpdatePosition } from '@/modules/positions/api/update-position';
import { useDeletePosition } from '@/modules/positions/api/delete-position';
import { notify } from '@/components/Notification';
import type { IPosition, PositionFormValues } from '@/modules/positions/types';
import { useTranslation } from 'react-i18next';

interface Props {
  department: IDepartment | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export function DepartmentPositionsModal({ department, onClose, onRefresh }: Props) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const [positionModal, setPositionModal] = useState(false);
  const [editPosition, setEditPosition] = useState<IPosition | null>(null);

  const positions: IDepartmentPosition[] = department?.positions ?? [];
  const isEdit = Boolean(editPosition);

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  const handleSubmit = async (values: PositionFormValues, id?: string) => {
    const notiId = notify.loading(
      isEdit ? t('department.updatingPosition') : t('department.creatingPosition'),
    );
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, payload: values });
      } else {
        await createMutation.mutateAsync({ ...values, department_id: department!.id });
      }
      notify.success(notiId, {
        message: isEdit ? t('department.positionUpdated') : t('department.positionCreated'),
      });
      setPositionModal(false);
      setEditPosition(null);
      onRefresh?.();
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? t('department.positionUpdateFailed') : t('department.positionCreateFailed')),
      });
    }
  };

  const handleDelete = async (id: string) => {
    const notiId = notify.loading(t('department.deletingPosition'));
    try {
      await deleteMutation.mutateAsync(id);
      notify.success(notiId, { message: t('department.positionDeleted') });
      onRefresh?.();
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || t('department.positionDeleteFailed'),
      });
    }
  };

  const rowEven = isDark ? '#1a1b1e' : '#ffffff';
  const rowOdd = isDark ? '#25262b' : '#f1f3f5';
  const rowBorder = isDark ? '#373a40' : '#e9ecef';
  const listBorder = isDark ? '#373a40' : '#dee2e6';
  const infoBg = isDark ? 'rgba(51, 65, 120, 0.25)' : 'rgba(224, 231, 255, 0.3)';
  const infoBorder = isDark ? '#3b4a8a' : '#dbe4ff';

  return (
    <>
      <Modal
        opened={!!department}
        onClose={onClose}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
              <IconBriefcase size={14} />
            </ThemeIcon>
            <Text fw={600} size="sm">
              {department?.department_name}
            </Text>
            <Badge size="xs" variant="light" color="blue">
              {t('department.totalPositions', { count: positions.length })}
            </Badge>
          </Group>
        }
        size="md"
      >
        <Stack gap="md">
          <Group
            gap="md"
            wrap="nowrap"
            align="flex-start"
            p="sm"
            style={{ borderRadius: 8, border: `1px solid ${infoBorder}`, background: infoBg }}
          >
            <Box style={{ flex: 2 }}>
              <Text size="xs" c="dimmed" mb={2}>
                {t('department.modal.detailsName')}
              </Text>
              <Text size="sm" fw={600}>
                {department?.department_name}{' '}
                <Text span size="xs" c="dimmed" ff="monospace">
                  ({department?.department_code})
                </Text>
              </Text>
            </Box>
            {department?.description && (
              <>
                <Divider orientation="vertical" />
                <Box style={{ flex: 3 }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {t('department.description')}
                  </Text>
                  <Text size="sm">{department.description}</Text>
                </Box>
              </>
            )}
          </Group>

          <Group justify="space-between" align="center">
            <Text size="sm" fw={600} c="dimmed">
              {t('department.positions')}
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={13} />}
              onClick={() => {
                setEditPosition(null);
                setPositionModal(true);
              }}
            >
              {t('department.addPosition')}
            </Button>
          </Group>

          {positions.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              {t('department.noPositions')}
            </Text>
          ) : (
            <Box style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${listBorder}` }}>
              {positions.map((pos: IDepartmentPosition, i: number) => (
                <Group
                  key={pos.id}
                  justify="space-between"
                  align="center"
                  py={10}
                  px="sm"
                  style={{
                    background: i % 2 === 0 ? rowEven : rowOdd,
                    borderBottom: i < positions.length - 1 ? `1px solid ${rowBorder}` : 'none',
                  }}
                >
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" c="dimmed" w={18} ta="right" style={{ flexShrink: 0 }}>
                      {i + 1}.
                    </Text>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} lh={1.3}>
                        {pos.position_name}
                      </Text>
                      {pos.description && (
                        <Text size="xs" c="dimmed" lh={1.4} lineClamp={1}>
                          {pos.description}
                        </Text>
                      )}
                    </Box>
                  </Group>
                  <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Badge
                      size="sm"
                      variant="light"
                      color={LEVEL_COLOR[pos.level as LevelPosition] ?? 'gray'}
                    >
                      {LEVEL_LABEL[pos.level as LevelPosition] ?? pos.level}
                    </Badge>
                    <Tooltip label={t('common.edit')} withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={() => {
                          setEditPosition({ ...pos, department_id: department!.id } as IPosition);
                          setPositionModal(true);
                        }}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t('common.delete')} withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(pos.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              ))}
            </Box>
          )}
        </Stack>
      </Modal>

      <PositionFormModal
        opened={positionModal}
        onClose={() => {
          setPositionModal(false);
          setEditPosition(null);
        }}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapPositionToFormValues(editPosition)}
        positionId={editPosition?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
