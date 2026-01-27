import {
  Text,
  Stack,
  Group,
  TextInput,
  Select,
  Button,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import { BaseTable, type TableColumn } from '../../../components/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import type { IEmployee } from '../types';

const columns: TableColumn<IEmployee>[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'email', title: 'Email', sortable: true },
  {
    key: 'role',
    title: 'Role',
    align: 'center',
    render: (row) => (
      <Text fw={500}>{row.role}</Text>
    ),
  },
  {
    key: 'age',
    title: 'Age',
    sortable: true,
    align: 'center',
    sortAccessor: (row) => row.age,
  },
];

// Mockdata
const MOCK_USERS: IEmployee[] = [
  { id: 1, name: 'Alice', email: 'alice@gmail.com', role: 'Admin', age: 18 },
  { id: 2, name: 'Bob', email: 'bob@gmail.com', role: 'User', age: 22 },
  { id: 3, name: 'Chris', email: 'chris@gmail.com', role: 'User', age: 25 },
  { id: 4, name: 'David', email: 'david@gmail.com', role: 'Manager', age: 30 },
  { id: 5, name: 'Emma', email: 'emma@gmail.com', role: 'Admin', age: 28 },
  { id: 6, name: 'Frank', email: 'frank@gmail.com', role: 'User', age: 19 },
  { id: 7, name: 'Grace', email: 'grace@gmail.com', role: 'User', age: 24 },
  { id: 8, name: 'Helen', email: 'helen@gmail.com', role: 'Manager', age: 35 },
  { id: 9, name: 'Ivan', email: 'ivan@gmail.com', role: 'User', age: 21 },
  { id: 10, name: 'Jane', email: 'jane@gmail.com', role: 'Admin', age: 27 },
];

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  return (
    <Stack gap="md">
      <Group>
        <Button>Add Employee</Button>
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
        onRowClick={(row) => console.log('Row click:', row)}
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
    </Stack>
  );
}
