import { Stack, Button, Group, TextInput, ActionIcon, Badge, Select } from '@mantine/core';
import { IconSearch, IconEdit, IconPlus } from '@tabler/icons-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useState, useMemo } from 'react';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { useGetPositions } from '../../positions/api/get-positions';
import { TableSkeleton } from '../../../components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import { useCreatePosition } from '../api/create-position';
import { useUpdatePosition } from '../api/update-position';
import { PositionFormModal } from '../components/PositionFormModal';
import { mapPositionToFormValues } from '../utils/position-mapper';
import { notify } from '../../../components/Notification';
import type { IPosition, PositionFormValues } from '../../positions/types';
import { PRIMARY_COLOR } from '@/theme';

export default function PositionsPage() {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [opened, setOpened] = useState(false);
  const [editPosition, setEditPosition] = useState<IPosition | null>(null);

  const isEdit = Boolean(editPosition);

  const {
    data,
    isLoading: _loading,
    error,
    refetch,
  } = useGetPositions({
    pageIndex: page,
    pageSize,
    search: search || undefined,
    department_id: departmentFilter || undefined,
  });
  const isLoading = useDelayedLoading(_loading);

  const { data: departmentsData } = useGetAllDepartments();
  const departments = departmentsData?.data || [];

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();

  const handleAdd = () => {
    setEditPosition(null);
    setOpened(true);
  };

  const handleEdit = (position: IPosition) => {
    setEditPosition(position);
    setOpened(true);
  };

  const handleSubmit = async (values: PositionFormValues, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating position...' : 'Creating position...');

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          payload: values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }

      notify.success(notiId, {
        message: isEdit ? 'Position updated successfully' : 'Position created successfully',
      });

      setOpened(false);
      setEditPosition(null);
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? 'Update position failed' : 'Create position failed'),
      });
    }
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditPosition(null);
  };

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((dept) => {
      map.set(dept.id, dept.department_name);
    });
    return map;
  }, [departments]);

  const positions = data?.data || [];
  const totalCount = data?.count || 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDepartmentFilter = (value: string | null) => {
    setDepartmentFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const columns: TableColumn<IPosition>[] = [
    {
      key: 'position_name',
      title: 'Position Name',
      sortable: true,
      width: 250,
    },
    {
      key: 'level',
      title: 'Level',
      sortable: true,
      width: 150,
      render: (row) => (
        <Badge variant="light" color={PRIMARY_COLOR} tt="capitalize" fw={400}>
          {row.level}
        </Badge>
      ),
    },
    {
      key: 'department_id',
      title: 'Department',
      sortable: true,
      width: 200,
      render: (row) => {
        const deptName = departmentMap.get(row.department_id);
        return deptName || '-';
      },
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => row.description || '-',
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      width: 100,
      render: (row) => (
        <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(row)} title="Edit">
          <IconEdit size={16} />
        </ActionIcon>
      ),
    },
  ];

  if (error) {
    return <ErrorState message={`Error loading positions: ${error.message}`} onRetry={refetch} />;
  }

  return (
    <Stack gap="md">
      <PageHeader
        title="Positions"
        description="Define roles and levels across departments"
        right={
          <Group gap="md" justify="space-between">
            <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
              Add Position
            </Button>
            <TextInput
              placeholder="Search positions..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => handleSearch(e.currentTarget.value)}
            />
            <Select
              placeholder="Filter by department"
              clearable
              data={departments.map((dept) => ({
                value: dept.id,
                label: dept.department_name,
              }))}
              value={departmentFilter}
              onChange={handleDepartmentFilter}
            />
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[200, 100, 160, 260, 80]} />
      ) : (
        <>
          <BaseTable
            data={positions}
            columns={columns}
            withTableBorder
            withColumnBorders
            stickyHeader
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <PositionFormModal
        opened={opened}
        onClose={handleCloseModal}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapPositionToFormValues(editPosition)}
        positionId={editPosition?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Stack>
  );
}
