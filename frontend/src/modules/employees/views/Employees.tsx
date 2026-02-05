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
import { useMemo, useState } from 'react';

import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import { BaseFormModal } from '../../../components/BaseFormModal';

import type { IEmployee } from '../types';
import {
  EmployeeForm,
  type EmployeeFormValues,
} from '../components/EmployeeFormModal';
import { notify } from '../../../components/Notification';

// Mock data
const MOCK_USERS: IEmployee[] = [
  { id: '1', name: 'Alice', email: 'alice@gmail.com', role: 'Admin', age: 18 },
  { id: '2', name: 'Bob', email: 'bob@gmail.com', role: 'User', age: 22 },
  { id: '3', name: 'Chris', email: 'chris@gmail.com', role: 'User', age: 25 },
  { id: '4', name: 'David', email: 'david@gmail.com', role: 'Manager', age: 30 },
  { id: '5', name: 'Emma', email: 'emma@gmail.com', role: 'Admin', age: 28 },
  { id: '6', name: 'Frank', email: 'frank@gmail.com', role: 'User', age: 19 },
  { id: '7', name: 'Grace', email: 'grace@gmail.com', role: 'User', age: 24 },
  { id: '8', name: 'Helen', email: 'helen@gmail.com', role: 'Manager', age: 35 },
  { id: '9', name: 'Ivan', email: 'ivan@gmail.com', role: 'User', age: 21 },
  { id: '10', name: 'Jane', email: 'jane@gmail.com', role: 'Admin', age: 27 },
];

export const DEFAULT_EMPLOYEE_VALUES: EmployeeFormValues = {
  name: '',
  email: '',
  role: '',
  age: 0,
};


export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [opened, setOpened] = useState(false);
  const [editEmployee, setEditEmployee] = useState<IEmployee | null>(null);

  const isEdit = Boolean(editEmployee);

  const filteredData = useMemo(() => {
    return MOCK_USERS.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = role ? u.role === role : true;

      return matchSearch && matchRole;
    });
  }, [search, role]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleAdd = () => {
    setEditEmployee(null);
    setOpened(true);
  };

  const handleEdit = (employee: IEmployee) => {
    setEditEmployee(employee);
    setOpened(true);
  };

  const handleSubmit = async (values: EmployeeFormValues) => {
    const notiId = notify.loading('Creating employee...');

    try {
      await new Promise((r) => setTimeout(r, 1000));

      notify.success(notiId, {
        message: 'Employee created successfully',
      });

      setOpened(false);
      setEditEmployee(null);
    } catch (e) {
      notify.error(notiId, {
        message: 'Create employee failed',
      });
    }
  };

  const columns: TableColumn<IEmployee>[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    {
      key: 'role',
      title: 'Role',
      align: 'center',
      render: (row) => <Text fw={500}>{row.role}</Text>,
    },
    {
      key: 'age',
      title: 'Age',
      sortable: true,
      align: 'center',
      sortAccessor: (row) => row.age,
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

  return (
    <Stack gap="md">
      <Group>
        <Button onClick={handleAdd}>Add employee</Button>
        {/* <Button onClick={() => notify.info({title: 'New Notification', message: 'Happy hour!!!'})}>Notify</Button> */}

        <TextInput
          placeholder="Search by name or email"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
        />

        <Select
          placeholder="Filter by role"
          clearable
          data={['Admin', 'Manager', 'User']}
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        />
      </Group>

      <BaseTable
        data={paginatedData}
        columns={columns}
        withTableBorder
        withColumnBorders
        stickyHeader
      />

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={filteredData.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <BaseFormModal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditEmployee(null);
        }}
        title={isEdit ? 'EDIT EMPLOYEE' : 'ADD EMPLOYEE'}
      >
        <EmployeeForm
          mode={isEdit ? 'edit' : 'add'}
          initialValues={isEdit && editEmployee ? {
            name: editEmployee.name,
            email: editEmployee.email,
            role: editEmployee.role,
            age: editEmployee.age,
          } : DEFAULT_EMPLOYEE_VALUES}
          onSubmit={handleSubmit}
        />
      </BaseFormModal>
    </Stack>
  );
}
