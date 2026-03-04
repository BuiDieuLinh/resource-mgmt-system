import { Stack, Group, TextInput, Select, Button, ActionIcon, Badge } from '@mantine/core';
import { IconEdit, IconSearch, IconEye, IconSitemap } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import ErrorState from '../../../components/ErrorState/ErrorState';

import type { IEmployee, EmployeeFormValues } from '../types';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { useGetEmployees } from '../api/get-employees';
import { useCreateEmployee } from '../api/create-employee';
import { useUpdateEmployee } from '../api/update-employee';
import { Loading } from '../../../components/Loading/Loading';
import { notify } from '../../../components/Notification';
import { mapEmployeeToFormValues } from '../utils/employee-mapper';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [opened, setOpened] = useState(false);
  const [editEmployee, setEditEmployee] = useState<IEmployee | null>(null);

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const isEdit = Boolean(editEmployee);

  const { data, isLoading, error, refetch } = useGetEmployees({
    pageIndex: page,
    pageSize,
    search: search || undefined,
    filter: filter || undefined,
  });

  const employees = data?.data || [];
  const totalCount = data?.count || 0;

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const handleAdd = () => {
    setEditEmployee(null);
    setOpened(true);
  };

  const handleEdit = (employee: IEmployee) => {
    setEditEmployee(employee);
    setOpened(true);
  };

  const handleSubmit = async (values: EmployeeFormValues, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating employee...' : 'Creating employee...');

    try {
      const payload = {
        employee_code: values.employee_code,
        full_name: values.full_name,
        display_name: values.display_name,
        email: values.email,
        phone: values.phone,
        identify_card: values.identify_card,
        gender: values.gender,
        date_of_birth:
          values.date_of_birth instanceof Date
            ? values.date_of_birth.toISOString()
            : values.date_of_birth,
        hire_date:
          values.hire_date instanceof Date
            ? values.hire_date.toISOString()
            : values.hire_date || new Date().toISOString(),
        department_id: values.department_id,
        position_id: values.position_id,
        status: values.status,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      notify.success(notiId, {
        message: isEdit ? 'Employee updated successfully' : 'Employee created successfully',
      });

      setOpened(false);
      setEditEmployee(null);
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? 'Update employee failed' : 'Create employee failed'),
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: string | null) => {
    setFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditEmployee(null);
  };

  const columns: TableColumn<IEmployee>[] = [
    {
      key: 'employee_code',
      title: 'Code',
      sortable: true,
    },
    {
      key: 'full_name',
      title: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (row) => row.phone || '-',
    },
    {
      key: 'position.position_name',
      title: 'Position',
      render: (row) =>
        row.position ? (
          <Badge variant="light" color="cyan" fw={400}>
            {row.position.position_name}
          </Badge>
        ) : (
          <Badge variant="light" color="gray" fw={400}>
            Unknown
          </Badge>
        ),
      sortable: true,
    },
    {
      key: 'hire_date',
      title: 'Hire Date',
      sortable: true,
      render: (row) => new Date(row.hire_date).toLocaleDateString('vi-VN'),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (row) => (
        <Badge variant="light" color={row.status === 'active' ? 'green' : 'gray'} fw={400}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (row) => (
        <Group gap="xs" justify="center">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => navigate(`/employees/${row.id}/profile`)}
            title="View Profile"
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(row)} title="Edit">
            <IconEdit size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  if (error) {
    return <ErrorState message={`Error loading employees: ${error.message}`} onRetry={refetch} />;
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Button onClick={handleAdd}>Add employee</Button>

          <Button
            variant="light"
            leftSection={<IconSitemap size={16} />}
            onClick={() => navigate('/employees/org-chart')}
          >
            View Org Chart
          </Button>
        </Group>

        <Group>
          <TextInput
            placeholder="Search by name, email or code"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => handleSearch(e.currentTarget.value)}
          />

          <Select
            placeholder="Filter by status"
            clearable
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={filter}
            onChange={handleFilterChange}
          />
        </Group>
      </Group>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <BaseTable
            data={employees}
            columns={columns}
            withTableBorder
            withColumnBorders
            stickyHeader
            withCheckbox
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              handlePageSizeChange(size);
            }}
          />
        </>
      )}

      <EmployeeFormModal
        opened={opened}
        onClose={() => {
          handleCloseModal;
        }}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapEmployeeToFormValues(editEmployee)}
        employeeId={editEmployee?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Stack>
  );
}
