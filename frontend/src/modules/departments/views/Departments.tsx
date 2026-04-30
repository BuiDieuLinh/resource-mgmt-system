import { Stack, Button, Group, TextInput, ActionIcon } from '@mantine/core';
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
import { mapDepartmentToFormValues } from '../utils/department-mapper';
import { notify } from '../../../components/Notification';
import type { IDepartment, DepartmentFormValues } from '../../departments/types';

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [opened, setOpened] = useState(false);
  const [editDepartment, setEditDepartment] = useState<IDepartment | null>(null);

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

  const handleAdd = () => {
    setEditDepartment(null);
    setOpened(true);
  };

  const handleEdit = (department: IDepartment) => {
    setEditDepartment(department);
    setOpened(true);
  };

  const handleSubmit = async (values: DepartmentFormValues, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating department...' : 'Creating department...');

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
        message: isEdit ? 'Department updated successfully' : 'Department created successfully',
      });

      setOpened(false);
      setEditDepartment(null);
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? 'Update department failed' : 'Create department failed'),
      });
    }
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditDepartment(null);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
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
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      width: 100,
      render: (row) => (
        <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(row)} title="Edit">
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
            <Button leftSection={<IconPlus size={18} />} onClick={handleAdd}>
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
        <TableSkeleton colWidths={[100, 200, 300, 80]} />
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
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <DepartmentFormModal
        opened={opened}
        onClose={handleCloseModal}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapDepartmentToFormValues(editDepartment)}
        departmentId={editDepartment?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Stack>
  );
}
