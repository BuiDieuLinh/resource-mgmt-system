import {
  Stack,
  Button,
  Group,
  TextInput,
  ActionIcon,
  Badge,
  Tooltip,
  Box,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconSearch, IconEdit, IconPlus, IconBriefcase, IconTrash } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useState } from 'react';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { TablePagination } from '@/components/Pagination';
import ErrorState from '@/components/ErrorState/ErrorState';
import { useGetDepartments } from '../../departments/api/get-departments';
import { TableSkeleton } from '@/components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useConfirm } from '@/hooks/useConfirm';
import { useCreateDepartment } from '../api/create-department';
import { useUpdateDepartment } from '../api/update-department';
import { useCreatePosition } from '@/modules/positions/api/create-position';
import { useUpdatePosition } from '@/modules/positions/api/update-position';
import { useDeletePosition } from '@/modules/positions/api/delete-position';
import { DepartmentFormModal } from '../components/DepartmentFormModal';
import { PositionFormModal } from '@/modules/positions/components/PositionFormModal';
import { mapDepartmentToFormValues } from '../utils/department-mapper';
import { mapPositionToFormValues } from '@/modules/positions/utils/position-mapper';
import { notify } from '@/components/Notification';
import { LEVEL_LABEL, LEVEL_COLOR, type LevelPosition } from '@/constant';
import type {
  IDepartment,
  DepartmentFormValues,
  IDepartmentPosition,
} from '../../departments/types';
import type { PositionFormValues, IPosition } from '@/modules/positions/types';
import {
  CollapsibleTable,
  type CollapsibleTableColumn,
} from '@/components/CollapsibleTable/CollapsibleTable';

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [opened, setOpened] = useState(false);
  const [editDepartment, setEditDepartment] = useState<IDepartment | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [addPositionModal, setAddPositionModal] = useState(false);
  const [editPositionModal, setEditPositionModal] = useState(false);
  const [selectedDepartmentForPosition, setSelectedDepartmentForPosition] =
    useState<IDepartment | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<IPosition | null>(null);

  const { confirm, ConfirmComponent } = useConfirm();
  const isEdit = Boolean(editDepartment);

  const {
    data,
    isLoading: _loading,
    error,
    refetch,
  } = useGetDepartments({
    pageIndex: page,
    pageSize,
    search: search || undefined,
  });
  const isLoading = useDelayedLoading(_loading);

  const departments = data?.data || [];
  const totalCount = data?.count || 0;

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const createPositionMutation = useCreatePosition();
  const updatePositionMutation = useUpdatePosition();
  const deletePositionMutation = useDeletePosition();

  const handleSubmit = async (values: DepartmentFormValues, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating department...' : 'Creating department...');
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, payload: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      notify.success(notiId, {
        message: isEdit ? 'Department updated successfully' : 'Department created successfully',
      });
      setOpened(false);
      setEditDepartment(null);
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || (isEdit ? 'Update failed' : 'Create failed'),
      });
    }
  };

  const handleAddPosition = async (values: PositionFormValues) => {
    const notiId = notify.loading('Creating position...');
    try {
      await createPositionMutation.mutateAsync({
        ...values,
        department_id: selectedDepartmentForPosition!.id,
      });
      notify.success(notiId, { message: 'Position created successfully' });
      setAddPositionModal(false);
      setSelectedDepartmentForPosition(null);
      refetch();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Create failed' });
    }
  };

  const handleEditPosition = async (values: PositionFormValues, id?: string) => {
    const notiId = notify.loading('Updating position...');
    try {
      await updatePositionMutation.mutateAsync({ id: id!, payload: values });
      notify.success(notiId, { message: 'Position updated successfully' });
      setEditPositionModal(false);
      setSelectedPosition(null);
      refetch();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Update failed' });
    }
  };

  const handleDeletePosition = (id: string, positionName: string) => {
    confirm({
      title: 'Delete Position',
      message: `Are you sure you want to delete position "${positionName}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        const notiId = notify.loading('Deleting position...');
        try {
          await deletePositionMutation.mutateAsync(id);
          notify.success(notiId, { message: 'Position deleted successfully' });
          refetch();
        } catch (e: any) {
          notify.error(notiId, { message: e?.response?.data?.message || 'Delete failed' });
        }
      },
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleDepartment = (dept: IDepartment) => {
    setExpandedDepts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dept.id)) {
        newSet.delete(dept.id);
      } else {
        newSet.add(dept.id);
      }
      return newSet;
    });
  };

  const columns: CollapsibleTableColumn<IDepartment>[] = [
    {
      key: 'department_code',
      title: 'Code',
      sortable: true,
      width: 120,
      render: (row) => (
        <Text size="sm" fw={500}>
          {row.department_code}
        </Text>
      ),
    },
    {
      key: 'department_name',
      title: 'Department Name',
      sortable: true,
      width: 250,
      render: (row) => (
        <Text size="sm" fw={500}>
          {row.department_name}
        </Text>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      sortable: true,
      width: 250,
      render: (row) => (
        <Text size="sm" c="dimmed">
          {row.description || '–'}
        </Text>
      ),
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      width: 120,
      render: (row) => (
        <Group gap="xs" justify="center">
          <Tooltip label="Add position" withArrow position="top">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDepartmentForPosition(row);
                setAddPositionModal(true);
              }}
            >
              <IconBriefcase size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit department" withArrow position="top">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                setEditDepartment(row);
                setOpened(true);
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  const renderCollapsedContent = (dept: IDepartment) => {
    const positions: IDepartmentPosition[] = dept.positions ?? [];

    const positionColumns: TableColumn<IDepartmentPosition>[] = [
      {
        key: 'index',
        title: '#',
        width: 50,
        render: (_, index) => (
          <Text size="xs" c="dimmed">
            {index + 1}
          </Text>
        ),
      },
      {
        key: 'position_name',
        title: 'Position Name',
        sortable: true,
        render: (row) => (
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
              <IconBriefcase size={14} />
            </ThemeIcon>
            <Text size="sm" fw={500}>
              {row.position_name}
            </Text>
          </Group>
        ),
      },
      {
        key: 'level',
        title: 'Level',
        width: 120,
        sortable: true,
        render: (row) => (
          <Badge
            size="sm"
            variant="light"
            color={LEVEL_COLOR[row.level as LevelPosition] ?? 'gray'}
          >
            {LEVEL_LABEL[row.level as LevelPosition] ?? row.level}
          </Badge>
        ),
      },
      {
        key: 'description',
        title: 'Description',
        render: (row) => (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {row.description || 'No descriptions'}
          </Text>
        ),
      },
      {
        key: 'action',
        title: 'Actions',
        align: 'center',
        width: 100,
        render: (row) => (
          <Group gap={6} justify="center">
            <Tooltip label="Edit" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => {
                  setSelectedPosition({ ...row, department_id: dept.id } as IPosition);
                  setEditPositionModal(true);
                }}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => handleDeletePosition(row.id, row.position_name)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      },
    ];

    return (
      <Box p="md">
        {positions.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No positions in this department
          </Text>
        ) : (
          <Stack gap="xs">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600} c="dimmed">
                Positions in {dept.department_name}
              </Text>
              <Badge size="sm" variant="dot" color="blue">
                {positions.length} total
              </Badge>
            </Group>

            <BaseTable
              data={positions}
              columns={positionColumns}
              highlightOnHover
              stickyHeader={false}
              height={300}
            />
          </Stack>
        )}
      </Box>
    );
  };

  if (error) {
    return <ErrorState message={`Error loading departments: ${error.message}`} onRetry={refetch} />;
  }

  return (
    <Stack gap="md">
      <PageHeader
        title="Departments"
        description="Manage your organization's departments"
        right={
          <Group>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditDepartment(null);
                setOpened(true);
              }}
            >
              Add Department
            </Button>
            <TextInput
              placeholder="Search departments..."
              leftSection={<IconSearch size={18} />}
              value={search}
              onChange={(e) => handleSearch(e.currentTarget.value)}
            />
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[50, 120, 250, 120, 120]} />
      ) : (
        <>
          <CollapsibleTable
            data={departments}
            columns={columns}
            collapsible
            renderCollapsedContent={renderCollapsedContent}
            isRowExpanded={(dept) => expandedDepts.has(dept.id)}
            onToggleRow={(dept) => toggleDepartment(dept)}
            getRowId={(dept) => dept.id}
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(v) => {
              setPageSize(v);
              setPage(1);
            }}
          />
        </>
      )}

      <DepartmentFormModal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditDepartment(null);
        }}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapDepartmentToFormValues(editDepartment)}
        departmentId={editDepartment?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <PositionFormModal
        opened={addPositionModal}
        onClose={() => {
          setAddPositionModal(false);
          setSelectedDepartmentForPosition(null);
        }}
        mode="add"
        initialValues={{ department_id: selectedDepartmentForPosition?.id }}
        onSubmit={handleAddPosition}
        loading={createPositionMutation.isPending}
      />

      <PositionFormModal
        opened={editPositionModal}
        onClose={() => {
          setEditPositionModal(false);
          setSelectedPosition(null);
        }}
        mode="edit"
        initialValues={mapPositionToFormValues(selectedPosition)}
        positionId={selectedPosition?.id}
        onSubmit={handleEditPosition}
        loading={updatePositionMutation.isPending}
      />

      <ConfirmComponent />
    </Stack>
  );
}
