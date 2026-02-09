import {
  Text,
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  ActionIcon,
} from '@mantine/core';
import { IconEdit, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';

import type { IEmployee, EmployeeFormValues } from '../types';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { useGetEmployees } from '../api/get-employees';
import { useCreateEmployee } from '../api/create-employee';
import { useUpdateEmployee } from '../api/update-employee';
import { Loading } from '../../../components/Loading/Loading';
import { notify } from '../../../components/Notification';
import { mapEmployeeToFormValues } from '../utils/employee-mapper';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [opened, setOpened] = useState(false);
  const [editEmployee, setEditEmployee] = useState<IEmployee | null>(null);

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
        date_of_birth: values.date_of_birth instanceof Date 
          ? values.date_of_birth.toISOString() 
          : values.date_of_birth,
        hire_date: values.hire_date instanceof Date 
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
        message: e?.response?.data?.message || (isEdit ? 'Update employee failed' : 'Create employee failed'),
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
  }

  const handleCloseModal = () => {
    setOpened(false);
    setEditEmployee(null);
  }

  const columns: TableColumn<IEmployee>[] = [
    { 
      key: 'employee_code', 
      title: 'Code', 
      sortable: true 
    },
    { 
      key: 'full_name', 
      title: 'Name', 
      sortable: true 
    },
    { 
      key: 'email', 
      title: 'Email', 
      sortable: true 
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (row) => (
        <Text 
          fw={500} 
          c={row.status === 'active' ? 'green' : 'gray'}
        >
          {row.status}
        </Text>
      ),
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (row) => (
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={() => handleEdit(row)}
        >
          <IconEdit size={16} />
        </ActionIcon>
      ),
    },
  ];

  if (error) {
    return (
      <Stack gap="md">
        <Text c="red">Error loading employees: {error.message}</Text>
        <Button onClick={() => refetch()}>Retry</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <Button onClick={handleAdd}>Add employee</Button>

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

      {isLoading ? (
        <Loading/>
      ) : (
        <>
          <BaseTable
            data={employees}
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
            onPageSizeChange={(size) => {handlePageSizeChange(size)}}
          />
        </>
      )}

      <EmployeeFormModal
        opened={opened}
        onClose={() => {handleCloseModal}}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapEmployeeToFormValues(editEmployee)}
        employeeId={editEmployee?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Stack>
  );
}
