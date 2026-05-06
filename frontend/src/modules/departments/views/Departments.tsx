import { Stack, Button, Group, TextInput, ActionIcon, Badge, Tooltip } from '@mantine/core';
import { IconSearch, IconEdit, IconPlus } from '@tabler/icons-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useState } from 'react';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { useGetDepartments } from '../../departments/api/get-departments';
import { TableSkeleton } from '../../../components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { useCreateDepartment } from '../api/create-department';
import { useUpdateDepartment } from '../api/update-department';
import { DepartmentFormModal } from '../components/DepartmentFormModal';
import { DepartmentPositionsModal } from '../components/DepartmentPositionsModal';
import { mapDepartmentToFormValues } from '../utils/department-mapper';
import { notify } from '../../../components/Notification';
import type { IDepartment, DepartmentFormValues } from '../../departments/types';

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [opened, setOpened] = useState(false);
  const [editDepartment, setEditDepartment] = useState<IDepartment | null>(null);
  const [positionsModal, setPositionsModal] = useState<IDepartment | null>(null);

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

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: TableColumn<IDepartment>[] = [
    {
      key: 'department_code',
      title: 'Code',
      sortable: true,
      width: 120,
    },
    {
      key: 'department_name',
      title: 'Department Name',
      sortable: true,
      width: 250,
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => row.description || '-',
      width: 300,
    },
    {
      key: 'positions_count',
      title: 'Positions',
      width: 100,
      align: 'center',
      render: (row) => {
        const count = row._count?.positions ?? 0;
        return (
          <Tooltip label="View positions" withArrow position="top">
            <Badge
              variant="light"
              color="blue"
              size="sm"
              style={{ cursor: count > 0 ? 'pointer' : 'default' }}
              onClick={() => count > 0 && setPositionsModal(row)}
            >
              {count}
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      width: 80,
      render: (row) => (
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => {
            setEditDepartment(row);
            setOpened(true);
          }}
        >
          <IconEdit size={18} />
        </ActionIcon>
      ),
    },
  ];

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
        <TableSkeleton colWidths={[100, 200, 300, 80, 80]} />
      ) : (
        <>
          <BaseTable
            data={departments}
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

      <DepartmentPositionsModal
        department={positionsModal}
        onClose={() => setPositionsModal(null)}
      />
    </Stack>
  );
}
